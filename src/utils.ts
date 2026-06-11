/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedAccount {
  isValid: boolean;
  raw: string;
  batchNumber: string; // 2 digits
  companyCode: string; // 2 digits
  companyName: string; // Decoded name
  circleCode: string;  // 1 digit
  divisionCode: string; // 1 digit
  subdivisionCode: string; // 1 digit
  consumerCode: string; // 7 digits
}

export interface RegionalAccount {
  isValid: boolean;
  raw: string;
  batch: string;       // first 2 digits
  company: string;     // next 5 digits
  circle: string;      // 8th digit
  division: string;    // 9th digit
  subdivision: string; // 10th digit
  consumer: string;    // remaining 4 digits
}

/**
 * Parses a 14-digit Account Number (e.g. 01263110083300) into area-based subdivisions using regional analysis logic:
 * - first 2 digits: batch
 * - next 5 digits: company
 * - 8th digit: circle code
 * - 9th digit: division code
 * - 10th digit: sub-division code
 */
export function parseRegionalAccountNumber(accountNum: string): RegionalAccount {
  const sanitized = accountNum.replace(/\D/g, '');
  const isValid = sanitized.length === 14;

  if (sanitized.length === 0) {
    return {
      isValid: false,
      raw: '',
      batch: '',
      company: '',
      circle: '',
      division: '',
      subdivision: '',
      consumer: '',
    };
  }

  // Fallback to padding if it's less than 14 digits, but marked invalid
  const padded = sanitized.padEnd(14, '0');

  return {
    isValid,
    raw: sanitized,
    batch: padded.substring(0, 2),
    company: padded.substring(2, 7),
    circle: padded.substring(7, 8),
    division: padded.substring(8, 9),
    subdivision: padded.substring(9, 10),
    consumer: padded.substring(10),
  };
}

/**
 * Parses a 14-digit Account Number (e.g. 01263110083300) into area-based subdivisions:
 * - First 2 digits (e.g. "01") represent Batch Number
 * - Next 2 digits (e.g. "26") represent Company (e.g. GEPCO 26000)
 * - 5th digit (e.g. "3") represent Circle Code (1, 2, 3, 5, 6, 7, 8)
 * - 6th digit (e.g. "1") represent Division Code
 * - 7th digit (e.g. "1") represent Subdivision Code
 * - Last 7 digits represent Consumer Code
 */
export function parseAccountNumber(accountNum: string): ParsedAccount {
  const sanitized = accountNum.replace(/\D/g, '');
  const isValid = sanitized.length === 14;

  if (sanitized.length === 0) {
    return {
      isValid: false,
      raw: '',
      batchNumber: '',
      companyCode: '',
      companyName: '',
      circleCode: '',
      divisionCode: '',
      subdivisionCode: '',
      consumerCode: '',
    };
  }

  const batchNumber = sanitized.substring(0, 2);
  const companyCode = sanitized.substring(2, 4);
  const circleCode = sanitized.substring(4, 5);
  const divisionCode = sanitized.substring(5, 6);
  const subdivisionCode = sanitized.substring(6, 7);
  const consumerCode = sanitized.substring(7, 14);

  // Decoded Company names typical for Pakistan Utilities based on prefix
  let companyName = '';
  if (companyCode) {
    switch (companyCode) {
      case '11':
      case '12':
      case '13':
        companyName = 'LESCO (Lahore)';
        break;
      case '22':
        companyName = 'FESCO (Faisalabad)';
        break;
      case '26':
        companyName = 'PESCO (Peshawar)';
        break;
      case '14':
        companyName = 'IESCO (Islamabad)';
        break;
      case '15':
      case '27':
        companyName = 'MEPCO (Multan)';
        break;
      case '25':
        companyName = 'HESCO (Hyderabad)';
        break;
      case '18':
      case '17':
        companyName = 'PESCO (Peshawar)';
        break;
      case '31':
        companyName = 'SEPCO (Sukkur)';
        break;
      case '24':
        companyName = 'QESCO (Quetta)';
        break;
      case '35':
        companyName = 'TESCO (Tribal Areas)';
        break;
      case '09':
      case '02':
      case '03':
      case '01':
        companyName = `Local Sub-Grid (${companyCode}000)`;
        break;
      default:
        companyName = `Company (${companyCode}000)`;
    }
  }

  return {
    isValid,
    raw: sanitized,
    batchNumber,
    companyCode,
    companyName: companyName || 'Unknown',
    circleCode,
    divisionCode,
    subdivisionCode,
    consumerCode: sanitized.substring(7),
  };
}

export function getCircleName(circleCode: string | number): string {
  const code = String(circleCode);
  switch (code) {
    case '1':
    case '261':
    case '26100':
      return 'Peshawar';
    case '2':
    case '262':
    case '26200':
      return 'Khyber';
    case '3':
    case '263':
    case '26300':
      return 'Mardan';
    case '5':
    case '265':
    case '26500':
      return 'Swat';
    case '6':
    case '266':
    case '26600':
      return 'Bannu';
    case '8':
    case '268':
    case '26800':
      return 'Swabi';
    case '9':
    case '269':
    case '26900':
      return 'DI Khan';
    default:
      return `Circle ${code}`;
  }
}

