/**
 * VietQR payload builder.
 *
 * Emits an EMVCo Merchant-Presented Mode QR string compatible with the Napas
 * VietQR scheme, so any Vietnamese banking app can scan and prefill a transfer.
 *
 * Reference: EMVCo "QR Code Specification for Payment Systems (EMV QRCPS)
 * Merchant-Presented Mode" v1.1, plus the Napas VietQR field profile
 * (GUID A000000727, service codes QRIBFTTA / QRIBFTTC).
 */

const GUID_VIETQR = 'A000000727';
const CURRENCY_VND = '704';
const COUNTRY_VN = 'VN';

const ID = {
  PAYLOAD_FORMAT: '00',
  INITIATION_METHOD: '01',
  MERCHANT_ACCOUNT: '38',
  CATEGORY_CODE: '52',
  CURRENCY: '53',
  AMOUNT: '54',
  COUNTRY: '58',
  MERCHANT_NAME: '59',
  MERCHANT_CITY: '60',
  ADDITIONAL_DATA: '62',
  CRC: '63'
};

const MERCHANT_ACCOUNT_SUB = {
  GUID: '00',
  BENEFICIARY: '01',
  SERVICE_CODE: '02'
};

const BENEFICIARY_SUB = {
  ACQUIRER_ID: '00',
  ACCOUNT_NUMBER: '01'
};

const ADDITIONAL_SUB = {
  PURPOSE: '08'
};

/** Transfer to a bank account number. */
export const SERVICE_TO_ACCOUNT = 'QRIBFTTA';
/** Transfer to a card number. */
export const SERVICE_TO_CARD = 'QRIBFTTC';

/** One-time QR carrying a fixed amount. */
const INITIATION_DYNAMIC = '12';
/** Reusable QR where the payer types the amount. */
const INITIATION_STATIC = '11';

/** Purpose-of-transaction length banks reliably accept. */
export const MAX_PURPOSE_LENGTH = 25;

/**
 * Napas bank identification numbers (BIN) for the banks EduPortal supports.
 * The BIN — not the SWIFT code — is what belongs in the QR payload.
 */
export const BANKS = [
  { bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam' },
  { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', shortName: 'Agribank', name: 'Ngân hàng NN&PTNT Việt Nam' },
  { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  { bin: '970422', shortName: 'MB Bank', name: 'Ngân hàng TMCP Quân đội' },
  { bin: '970416', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh vượng' },
  { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' }
];

export function findBankByBin(bin) {
  return BANKS.find((bank) => bank.bin === bin) || null;
}

/**
 * Strips Vietnamese diacritics and any remaining non-ASCII bytes.
 *
 * EMVCo payloads are byte-oriented and several banking apps mis-decode
 * multi-byte UTF-8 in the free-text fields, so everything user-supplied is
 * folded to ASCII before it reaches the QR.
 */
export function toAscii(input) {
  if (!input) return '';
  return String(input)
    .normalize('NFD')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * CRC-16/CCITT-FALSE — polynomial 0x1021, initial value 0xFFFF, no reflection,
 * no final XOR. This is the checksum EMVCo field 63 mandates.
 */
export function crc16(input) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= (input.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Encodes one EMVCo tag-length-value field. Length is always 2 digits. */
export function tlv(id, value) {
  const str = String(value);
  if (str.length > 99) {
    throw new Error(`VietQR field ${id} exceeds the 99-character EMVCo limit`);
  }
  return `${id}${String(str.length).padStart(2, '0')}${str}`;
}

/**
 * Parses an EMVCo payload into a flat map of tag -> value.
 * Used by the tests and by anything that needs to verify a QR before display.
 */
export function parseTlv(payload) {
  const fields = {};
  let cursor = 0;
  while (cursor + 4 <= payload.length) {
    const id = payload.slice(cursor, cursor + 2);
    const length = Number.parseInt(payload.slice(cursor + 2, cursor + 4), 10);
    if (Number.isNaN(length)) break;
    fields[id] = payload.slice(cursor + 4, cursor + 4 + length);
    cursor += 4 + length;
  }
  return fields;
}

function validate({ bin, accountNumber, amount, purpose }) {
  const errors = [];

  if (!/^\d{6}$/.test(String(bin || ''))) {
    errors.push('Mã ngân hàng (BIN) phải gồm đúng 6 chữ số.');
  }
  const account = String(accountNumber || '').trim();
  if (!/^[0-9A-Za-z]{4,19}$/.test(account)) {
    errors.push('Số tài khoản chỉ gồm chữ và số, độ dài 4–19 ký tự.');
  }
  if (amount !== undefined && amount !== null && amount !== '') {
    if (!Number.isInteger(amount) || amount <= 0) {
      errors.push('Số tiền phải là số nguyên dương (đơn vị VND, không có phần lẻ).');
    } else if (String(amount).length > 13) {
      errors.push('Số tiền vượt quá 13 chữ số cho phép.');
    }
  }
  if (purpose && toAscii(purpose).length > MAX_PURPOSE_LENGTH) {
    errors.push(`Nội dung chuyển khoản tối đa ${MAX_PURPOSE_LENGTH} ký tự.`);
  }

  return errors;
}

/**
 * Builds a scannable VietQR payload.
 *
 * Omitting `amount` produces a static QR the payer fills in themselves;
 * supplying it produces a one-time QR with the amount locked, which is what
 * tuition invoices use.
 *
 * @returns {{ payload: string, errors: string[] }} `payload` is empty when
 * validation fails, so callers never render an unscannable code.
 */
export function buildVietQrPayload({
  bin,
  accountNumber,
  accountName,
  amount,
  purpose,
  serviceCode = SERVICE_TO_ACCOUNT,
  city
}) {
  const errors = validate({ bin, accountNumber, amount, purpose });
  if (errors.length > 0) {
    return { payload: '', errors };
  }

  const beneficiary =
    tlv(BENEFICIARY_SUB.ACQUIRER_ID, bin) +
    tlv(BENEFICIARY_SUB.ACCOUNT_NUMBER, String(accountNumber).trim());

  const merchantAccount =
    tlv(MERCHANT_ACCOUNT_SUB.GUID, GUID_VIETQR) +
    tlv(MERCHANT_ACCOUNT_SUB.BENEFICIARY, beneficiary) +
    tlv(MERCHANT_ACCOUNT_SUB.SERVICE_CODE, serviceCode);

  const hasAmount = Number.isInteger(amount) && amount > 0;

  let body =
    tlv(ID.PAYLOAD_FORMAT, '01') +
    tlv(ID.INITIATION_METHOD, hasAmount ? INITIATION_DYNAMIC : INITIATION_STATIC) +
    tlv(ID.MERCHANT_ACCOUNT, merchantAccount) +
    tlv(ID.CURRENCY, CURRENCY_VND);

  if (hasAmount) {
    body += tlv(ID.AMOUNT, String(amount));
  }

  body += tlv(ID.COUNTRY, COUNTRY_VN);

  const name = toAscii(accountName).slice(0, 25);
  if (name) {
    body += tlv(ID.MERCHANT_NAME, name);
  }

  const merchantCity = toAscii(city).slice(0, 15);
  if (merchantCity) {
    body += tlv(ID.MERCHANT_CITY, merchantCity);
  }

  const cleanPurpose = toAscii(purpose).slice(0, MAX_PURPOSE_LENGTH);
  if (cleanPurpose) {
    body += tlv(ID.ADDITIONAL_DATA, tlv(ADDITIONAL_SUB.PURPOSE, cleanPurpose));
  }

  const withCrcTag = `${body}${ID.CRC}04`;
  return { payload: `${withCrcTag}${crc16(withCrcTag)}`, errors: [] };
}

/** Verifies that a payload's trailing checksum matches its content. */
export function isValidPayload(payload) {
  if (typeof payload !== 'string' || payload.length < 8) return false;
  const body = payload.slice(0, -4);
  if (!body.endsWith(`${ID.CRC}04`)) return false;
  return crc16(body) === payload.slice(-4).toUpperCase();
}

/**
 * Builds the transfer memo for a tuition invoice.
 *
 * Keeping it deterministic matters: the school reconciles bank statements by
 * matching this string, so the same invoice must always produce the same memo.
 */
export function buildTuitionPurpose(studentId, invoiceId) {
  return toAscii(`${studentId} ${invoiceId}`).toUpperCase().slice(0, MAX_PURPOSE_LENGTH);
}
