import { ClientInvoice, InputVatPurchase } from '../types';

export type InvoiceAmounts = {
  taxableValue: number;
  nonTaxableValue: number;
  outputVat: number;
  total: number;
};

export type VatPeriodSummary = {
  taxableValue: number;
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  vatWithheld: number;
  vatBalanceAfterWithholding: number;
  invoicedButUnpaid: number;
};

function roundCurrency(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function assertValidAmount(amount: number, label: string) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`${label} must be a finite, non-negative amount.`);
  }
}

function isWithinPeriod(date: string, periodStart: string, periodEnd: string) {
  return date >= periodStart && date <= periodEnd;
}

export function calculateInvoiceAmounts(invoice: ClientInvoice): InvoiceAmounts {
  let taxableValue = 0;
  let nonTaxableValue = 0;
  let outputVat = 0;

  for (const line of invoice.lines) {
    assertValidAmount(line.amount, `Invoice line "${line.description}"`);
    assertValidAmount(line.vatRatePercent, `VAT rate for "${line.description}"`);
    if (!line.taxable && line.vatRatePercent !== 0) {
      throw new RangeError(`Non-taxable invoice line "${line.description}" must have a zero VAT rate.`);
    }

    if (line.taxable) {
      taxableValue += line.amount;
      outputVat += roundCurrency(line.amount * (line.vatRatePercent / 100));
    } else {
      nonTaxableValue += line.amount;
    }
  }

  taxableValue = roundCurrency(taxableValue);
  nonTaxableValue = roundCurrency(nonTaxableValue);
  outputVat = roundCurrency(outputVat);

  return {
    taxableValue,
    nonTaxableValue,
    outputVat,
    total: roundCurrency(taxableValue + nonTaxableValue + outputVat),
  };
}

export function calculateVatPeriodSummary(
  invoices: ClientInvoice[],
  purchases: InputVatPurchase[],
  periodStart: string,
  periodEnd: string,
): VatPeriodSummary {
  if (periodStart > periodEnd) {
    throw new RangeError('VAT period start must be on or before its end.');
  }

  const issuedInvoices = invoices.filter((invoice) =>
    invoice.status === 'Issued' && isWithinPeriod(invoice.issuedAt, periodStart, periodEnd),
  );

  let taxableValue = 0;
  let outputVat = 0;
  let vatWithheld = 0;
  let invoicedButUnpaid = 0;

  for (const invoice of issuedInvoices) {
    const amounts = calculateInvoiceAmounts(invoice);
    taxableValue += amounts.taxableValue;
    outputVat += amounts.outputVat;

    let settledAmount = 0;
    for (const payment of invoice.payments) {
      if (payment.date > periodEnd) {
        continue;
      }
      assertValidAmount(payment.amountReceived, `Payment ${payment.id}`);
      assertValidAmount(payment.vatWithheldAmount, `VAT withholding for payment ${payment.id}`);
      settledAmount += payment.amountReceived + payment.vatWithheldAmount;
      if (isWithinPeriod(payment.date, periodStart, periodEnd)) {
        vatWithheld += payment.vatWithheldAmount;
      }
    }

    invoicedButUnpaid += Math.max(0, amounts.total - settledAmount);
  }

  const inputVat = purchases.reduce((total, purchase) => {
    if (purchase.status !== 'Valid' || !purchase.claimable ||
        !isWithinPeriod(purchase.purchaseDate, periodStart, periodEnd)) {
      return total;
    }
    assertValidAmount(purchase.vatAmount, `Input VAT purchase ${purchase.id}`);
    return total + purchase.vatAmount;
  }, 0);

  const roundedOutputVat = roundCurrency(outputVat);
  const roundedInputVat = roundCurrency(inputVat);
  const roundedVatWithheld = roundCurrency(vatWithheld);
  const netVatPayable = roundCurrency(roundedOutputVat - roundedInputVat);

  return {
    taxableValue: roundCurrency(taxableValue),
    outputVat: roundedOutputVat,
    inputVat: roundedInputVat,
    netVatPayable,
    vatWithheld: roundedVatWithheld,
    vatBalanceAfterWithholding: roundCurrency(netVatPayable - roundedVatWithheld),
    invoicedButUnpaid: roundCurrency(invoicedButUnpaid),
  };
}
