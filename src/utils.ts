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
    company: padded.substring(2, 7), // 5 digits (e.g. 26311)
    circle: padded.substring(4, 5),   // 5th digit (e.g. '3' for Mardan)
    division: padded.substring(5, 6), // 6th digit (e.g. '1', '2', '5')
    subdivision: padded.substring(6, 7), // 7th digit (e.g. subdivision within division)
    consumer: padded.substring(7),
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

export function getDivisionName(divisionCode: string | number, circleCode?: string | number): string {
  const divStr = String(divisionCode);
  const circleStr = circleCode ? String(circleCode) : '3';
  
  let code = divStr;
  if (divStr.startsWith('263')) {
    code = divStr.substring(4, 5);
  }

  if (circleStr === '3' || circleStr === '263' || circleStr === '26300' || circleStr === 'all') {
    switch (code) {
      case '1':
        return 'Division-I (26310)';
      case '2':
        return 'Division-II (26320)';
      case '5':
        return 'Division-III (26350)';
      default:
        return `Division ${code}`;
    }
  }

  return `Division ${code}`;
}

export function getSubdivisionName(
  subdivCode: string | number,
  divisionCode?: string | number,
  circleCode?: string | number
): string {
  const subStr = String(subdivCode);
  const divStr = divisionCode ? String(divisionCode) : '1';
  const circleStr = circleCode ? String(circleCode) : '3';
  
  let sCode = subStr;
  let dCode = divStr;

  if (subStr.startsWith('263')) {
    dCode = subStr.substring(3, 4);
    sCode = subStr.substring(4, 5);
  } else if (divStr.startsWith('263')) {
    dCode = divStr.substring(4, 5);
  }

  if (circleStr === '3' || circleStr === '263' || circleStr === '26300' || circleStr === 'all') {
    const prefix = `263${dCode}${sCode}`;
    
    if (dCode === '1') { // 26310
      switch (sCode) {
        case '1': return `Subdivision-I (26311)`;
        case '2': return `Subdivision-II (26312)`;
        case '3': return `Subdivision-III (26313)`;
        case '4': return `Subdivision-IV (26314)`;
        case '5': return `Subdivision-V (26315)`;
        case '6': return `Subdivision-VI (26316)`;
        case '7': return `Subdivision-VII (26317)`;
        default: return `Sub-Div ${sCode} (2631${sCode})`;
      }
    } else if (dCode === '2') { // 26320
      switch (sCode) {
        case '1': return `Subdivision-I (26321)`;
        case '2': return `Subdivision-II (26322)`;
        case '3': return `Subdivision-III (26323)`;
        case '4': return `Subdivision-IV (26324)`;
        case '8': return `Subdivision-VIII (26328)`;
        case '9': return `Subdivision-IX (26329)`;
        default: return `Sub-Div ${sCode} (2632${sCode})`;
      }
    } else if (dCode === '5') { // 26350
      switch (sCode) {
        case '1': return `Subdivision-I (26351)`;
        case '2': return `Subdivision-II (26352)`;
        case '4': return `Subdivision-IV (26354)`;
        case '5': return `Subdivision-V (26355)`;
        default: return `Sub-Div ${sCode} (2635${sCode})`;
      }
    }
  }

  return `Sub-Div ${sCode}`;
}

