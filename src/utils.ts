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

export interface PescoSubdivision {
  code: string;
  name: string;
}

export interface PescoDivision {
  code: string;
  name: string;
  subdivisions: PescoSubdivision[];
}

export interface PescoCircle {
  code: string;
  name: string;
  divisions: PescoDivision[];
}

const DEFAULT_HIERARCHY: PescoCircle[] = [
  {
    code: '261',
    name: 'PESHAWAR',
    divisions: [
      {
        code: '2611',
        name: 'CITY RURAL',
        subdivisions: [
          { code: '26111', name: 'NISHTRABAD' },
          { code: '26112', name: 'CHAMKANI' },
          { code: '26113', name: 'HASHTNAGRI' },
          { code: '26114', name: 'REHMAN BABA' },
          { code: '26115', name: 'LALA' },
          { code: '26116', name: 'FAQIR ABAD' },
          { code: '26117', name: 'SETHI TOWN' }
        ]
      },
      {
        code: '2612',
        name: 'CITY DIVISION',
        subdivisions: [
          { code: '26121', name: 'GUL BAHAR' },
          { code: '26122', name: 'SIKANDAR PURA' },
          { code: '26123', name: 'CHOWK YADGAR' },
          { code: '26124', name: 'QISSA KHANI' },
          { code: '26125', name: 'DABGARI' },
          { code: '26126', name: 'GUL BAHAR NO-2' },
          { code: '26127', name: 'WAZIR BAGH' },
          { code: '26128', name: 'RASHID GHARI' }
        ]
      },
      {
        code: '2613',
        name: 'CANTT',
        subdivisions: [
          { code: '26131', name: 'PESHAWAR CANTT.' },
          { code: '6131', name: 'PESHAWAR CANTT.' },
          { code: '26132', name: 'GULBERG' },
          { code: '26133', name: 'U.TOWN NO-I' },
          { code: '26134', name: 'U.TOWN NO-II' },
          { code: '26135', name: 'KOHAT ROAD' }
        ]
      },
      {
        code: '2614',
        name: 'CHARSADDA',
        subdivisions: [
          { code: '26141', name: 'CHARSADDA TOWN' },
          { code: '26142', name: 'SARDHERI' },
          { code: '26143', name: 'UTMANZAI-I' },
          { code: '26144', name: 'UMERZAI' },
          { code: '26145', name: 'NISATTA' },
          { code: '26146', name: 'RAJJAR' },
          { code: '26147', name: 'HARICHAND CHD' }
        ]
      },
      {
        code: '2615',
        name: 'SHABQADAR',
        subdivisions: [
          { code: '26151', name: 'SHABQADAR' },
          { code: '26152', name: 'DOABA' },
          { code: '26153', name: 'MATTA' },
          { code: '26154', name: 'TANGI' }
        ]
      },
      {
        code: '2616',
        name: 'PSH RURAL',
        subdivisions: [
          { code: '26161', name: 'WARSAK-I' },
          { code: '26162', name: 'DAUD ZAI' },
          { code: '26163', name: 'GUL BELA' },
          { code: '26164', name: 'WARSAK-II' },
          { code: '26165', name: 'SHAHI BAGH' },
          { code: '26166', name: 'NAGUMAN' }
        ]
      }
    ]
  },
  {
    code: '262',
    name: 'Khyber',
    divisions: [
      {
        code: '2621',
        name: 'KHYBER',
        subdivisions: [
          { code: '26211', name: 'DEH BAHADER' },
          { code: '26212', name: 'MATTANI' },
          { code: '26213', name: 'BADABER' },
          { code: '26214', name: 'HAYATABAD' },
          { code: '26215', name: 'LANDI ARBAB' },
          { code: '26216', name: 'HAYAT ABAD II' },
          { code: '26217', name: 'TAJ ABAD' }
        ]
      },
      {
        code: '2622',
        name: 'NOWSHEHRA DIV NO.2',
        subdivisions: [
          { code: '26221', name: 'PABBI-I' },
          { code: '26222', name: 'PABBI-II' },
          { code: '26223', name: 'PABBI-III' },
          { code: '26224', name: 'NOWSHERA CITY' },
          { code: '26225', name: 'RISALPUR' },
          { code: '26226', name: 'PIR PAI' }
        ]
      },
      {
        code: '2623',
        name: 'NOWSHERA CANTT',
        subdivisions: [
          { code: '26231', name: 'NOWSHERA CANTT-I' },
          { code: '26232', name: 'NOWSHERA CANTT-II' },
          { code: '26233', name: 'JEHANGIRA' },
          { code: '26234', name: 'AKORA KHATTAK' }
        ]
      },
      {
        code: '2624',
        name: 'KOHAT',
        subdivisions: [
          { code: '26241', name: 'KOHAT URBAN' },
          { code: '26242', name: 'COLLEGE TOWN' },
          { code: '26243', name: 'GUMBAT' },
          { code: '26247', name: 'KOTAL TOWN' },
          { code: '26248', name: 'BABARI BANDA' }
        ]
      },
      {
        code: '2625',
        name: 'HANGU',
        subdivisions: [
          { code: '26251', name: 'HANGU' },
          { code: '26252', name: 'USTERZAI' },
          { code: '26253', name: 'TALL' }
        ]
      },
      {
        code: '2626',
        name: 'KOHAT RURAL',
        subdivisions: [
          { code: '26261', name: 'URBAN-II' },
          { code: '26262', name: 'RURAL' },
          { code: '26263', name: 'LACHI-I' },
          { code: '26264', name: 'LACHI-II' }
        ]
      }
    ]
  },
  {
    code: '263',
    name: 'Mardan',
    divisions: [
      {
        code: '2631',
        name: 'Mardan-1',
        subdivisions: [
          { code: '26311', name: 'MARDAN CITY-I' },
          { code: '26312', name: 'MARDAN CITY-II' },
          { code: '26313', name: 'MARDAN CANTT.' },
          { code: '26314', name: 'PAR HOTI' },
          { code: '26315', name: 'TORU' },
          { code: '26316', name: 'GUJAR GHARI' },
          { code: '26317', name: 'SHIEKH MALTON' }
        ]
      },
      {
        code: '2632',
        name: 'Mardan-2',
        subdivisions: [
          { code: '26321', name: 'RUSTAM' },
          { code: '26322', name: 'SAWAL DHER' },
          { code: '26323', name: 'BAKHSHALI' },
          { code: '26324', name: 'GARHI KAPURA' },
          { code: '26328', name: 'KATLANG' },
          { code: '26329', name: 'SHAH DHAND' }
        ]
      },
      {
        code: '2635',
        name: 'Takhtbai',
        subdivisions: [
          { code: '26351', name: 'TAKHT BHAI-I' },
          { code: '26352', name: 'TAKHT BHAI-II' },
          { code: '26354', name: 'SHER GARH' },
          { code: '26355', name: 'LUND KHUWAR' }
        ]
      }
    ]
  },
  {
    code: '265',
    name: 'Swat',
    divisions: [
      {
        code: '2651',
        name: 'Dargai',
        subdivisions: [
          { code: '26511', name: 'DARGAI-I' },
          { code: '26512', name: 'DARGAI-II' },
          { code: '26513', name: 'BATKHELA' },
          { code: '26514', name: 'THANA' },
          { code: '26515', name: 'BATKHALA-2' },
          { code: '26516', name: 'SKHAKOT' },
          { code: '26517', name: 'City Batkhela' }
        ]
      },
      {
        code: '2652',
        name: 'Swat 1',
        subdivisions: [
          { code: '26521', name: 'MINGORA URBAN' },
          { code: '26522', name: 'AMANKOT' },
          { code: '26523', name: 'BRIKOT' },
          { code: '26524', name: 'MIGORA-2' },
          { code: '26525', name: 'CHARBAGH' },
          { code: '26526', name: 'KANGU' },
          { code: '26527', name: 'KABAL' },
          { code: '26528', name: 'MINGORA' },
          { code: '26529', name: 'DEVLIAS' }
        ]
      },
      {
        code: '2653',
        name: 'Timargara',
        subdivisions: [
          { code: '26531', name: 'TAMERGARA' },
          { code: '26532', name: 'SAMARBAGH' },
          { code: '26533', name: 'CHEKDARA' },
          { code: '26534', name: 'GUL ABAD' },
          { code: '26536', name: 'TIMERGARA-II' },
          { code: '26538', name: 'TALASH' },
          { code: '26539', name: 'LAL QALLA' }
        ]
      },
      {
        code: '2654',
        name: 'Buner',
        subdivisions: [
          { code: '26541', name: 'DAGGAR-I' },
          { code: '26542', name: 'DAGGAR-II' }
        ]
      },
      {
        code: '2655',
        name: 'Dir',
        subdivisions: [
          { code: '26551', name: 'DIR' },
          { code: '26552', name: 'CHITRAL' },
          { code: '26553', name: 'WARI' }
        ]
      },
      {
        code: '2656',
        name: 'Swat 2',
        subdivisions: [
          { code: '26561', name: 'KHAWAZA KHELA' },
          { code: '26562', name: 'MADYAN' },
          { code: '26563', name: 'MATTA' }
        ]
      },
      {
        code: '2657',
        name: 'Shangla',
        subdivisions: [
          { code: '26571', name: 'Alpuri' },
          { code: '26572', name: 'Besham' },
          { code: '26573', name: 'Puran' },
          { code: '26574', name: 'Chakesar Sub Office' },
          { code: '26576', name: 'Martung Sub Office' }
        ]
      }
    ]
  },
  {
    code: '266',
    name: 'BANNU',
    divisions: [
      {
        code: '2661',
        name: 'BANNU',
        subdivisions: [
          { code: '26611', name: 'URBAN' },
          { code: '26612', name: 'BANNU CANTT' },
          { code: '26615', name: 'DOMEL' },
          { code: '26617', name: 'SURRANI' }
        ]
      },
      {
        code: '2662',
        name: 'LAKKI',
        subdivisions: [
          { code: '26621', name: 'LAKKI' },
          { code: '26622', name: 'SERAI NAURANG' },
          { code: '26623', name: 'PEAZU' },
          { code: '26624', name: 'GAMBILA' }
        ]
      },
      {
        code: '2665',
        name: 'KARAK',
        subdivisions: [
          { code: '26651', name: 'KARAK' },
          { code: '26652', name: 'LATAMBER' },
          { code: '26653', name: 'TAKHTI NASRATI' }
        ]
      },
      {
        code: '2667',
        name: 'BANNU-II',
        subdivisions: [
          { code: '26671', name: 'RURAL-I' },
          { code: '26672', name: 'RURAL-II' },
          { code: '26673', name: 'GHORIWALA' },
          { code: '26674', name: 'KAKKI' }
        ]
      }
    ]
  },
  {
    code: '268',
    name: 'SWABI',
    divisions: [
      {
        code: '2681',
        name: 'SWABI-I',
        subdivisions: [
          { code: '26811', name: 'SWABI-I' },
          { code: '26812', name: 'SWABI-II' },
          { code: '26813', name: 'KHADO KHEL' }
        ]
      },
      {
        code: '2682',
        name: 'RAZAR',
        subdivisions: [
          { code: '26821', name: 'YAR HUSSAIN-I' },
          { code: '26822', name: 'ISMAILIA' },
          { code: '26823', name: 'YAR HUSSAIN-II' },
          { code: '26824', name: 'NAWA KALI' },
          { code: '26825', name: 'SHAWA' }
        ]
      },
      {
        code: '2683',
        name: 'SWABI-II',
        subdivisions: [
          { code: '26831', name: 'LAHORE SWABI' },
          { code: '26832', name: 'ZAIDA' },
          { code: '26833', name: 'TORDHER' },
          { code: '26834', name: 'MARGHUZ' }
        ]
      },
      {
        code: '2684',
        name: 'TOPI',
        subdivisions: [
          { code: '26841', name: 'TOPI' },
          { code: '26842', name: 'GADOON' },
          { code: '26843', name: 'KALABAT' }
        ]
      }
    ]
  },
  {
    code: '269',
    name: 'DI KHAN',
    divisions: [
      {
        code: '2691',
        name: 'CITY DIV DIK',
        subdivisions: [
          { code: '26911', name: 'CITY-1 DIK' },
          { code: '26912', name: 'CITY-II DIK' },
          { code: '26913', name: 'RURAL DIK' },
          { code: '26914', name: 'DRABAN DIK' }
        ]
      },
      {
        code: '2692',
        name: 'TANK DIV',
        subdivisions: [
          { code: '26921', name: 'TANK-I' },
          { code: '26922', name: 'TANK-II' },
          { code: '26923', name: 'KULACHI' }
        ]
      },
      {
        code: '2693',
        name: 'RURAL DIV DIK',
        subdivisions: [
          { code: '26931', name: 'CANTT DIK' },
          { code: '26932', name: 'PAHARPUR' },
          { code: '26933', name: 'MANDHRA' },
          { code: '26934', name: 'PANYALA' }
        ]
      }
    ]
  }
];

export const PESCO_HIERARCHY: PescoCircle[] = [];

// Initialize hierarchy
const savedHierarchyStr = typeof window !== 'undefined' ? localStorage.getItem('pesco_hierarchy') : null;
if (savedHierarchyStr) {
  try {
    const parsed = JSON.parse(savedHierarchyStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      PESCO_HIERARCHY.push(...parsed);
    } else {
      PESCO_HIERARCHY.push(...DEFAULT_HIERARCHY);
    }
  } catch {
    PESCO_HIERARCHY.push(...DEFAULT_HIERARCHY);
  }
} else {
  PESCO_HIERARCHY.push(...DEFAULT_HIERARCHY);
}

export function updatePescoHierarchy(newHierarchy: PescoCircle[]) {
  PESCO_HIERARCHY.length = 0;
  PESCO_HIERARCHY.push(...JSON.parse(JSON.stringify(newHierarchy))); // deep clone
  if (typeof window !== 'undefined') {
    localStorage.setItem('pesco_hierarchy', JSON.stringify(newHierarchy));
    window.dispatchEvent(new Event('pesco-hierarchy-updated'));
  }
}

export function getMappedCircle(circleCode: string | number): PescoCircle | undefined {
  const code = String(circleCode);
  switch (code) {
    case '1':
    case '261':
    case '26100':
      return PESCO_HIERARCHY.find(c => c.code === '261');
    case '2':
    case '262':
    case '26200':
      return PESCO_HIERARCHY.find(c => c.code === '262');
    case '3':
    case '263':
    case '26300':
      return PESCO_HIERARCHY.find(c => c.code === '263');
    case '5':
    case '265':
    case '26500':
    case '2665':
      return PESCO_HIERARCHY.find(c => c.code === '265');
    case '6':
    case '266':
    case '26600':
      return PESCO_HIERARCHY.find(c => c.code === '266');
    case '8':
    case '268':
    case '26800':
      return PESCO_HIERARCHY.find(c => c.code === '268');
    case '9':
    case '269':
    case '26900':
      return PESCO_HIERARCHY.find(c => c.code === '269');
    default:
      return PESCO_HIERARCHY.find(c => c.code === code || c.code.endsWith(code));
  }
}

export function getCircleName(circleCode: string | number): string {
  const code = String(circleCode);
  const circle = getMappedCircle(code);
  return circle ? circle.name : `Circle ${code}`;
}

export function getDivisionName(divisionCode: string | number, circleCode?: string | number): string {
  const divStr = String(divisionCode);
  const circleStr = circleCode ? String(circleCode) : '';
  
  if (circleStr) {
    const mappedCircle = getMappedCircle(circleStr);
    if (mappedCircle) {
      const div = mappedCircle.divisions.find(d => 
        d.code === divStr || 
        d.code.endsWith(divStr) ||
        (divStr.length === 1 && d.code === mappedCircle.code + divStr)
      );
      if (div) return div.name;
    }
  }
  
  // Backwards compatibility global search
  for (const c of PESCO_HIERARCHY) {
    const div = c.divisions.find(d => 
      d.code === divStr || 
      d.code.endsWith(divStr) ||
      (divStr.length === 1 && d.code === c.code + divStr)
    );
    if (div) return div.name;
  }
  
  return `Division ${divStr}`;
}

export function getSubdivisionName(
  subdivCode: string | number,
  divisionCode?: string | number,
  circleCode?: string | number
): string {
  const subStr = String(subdivCode);
  const divStr = divisionCode ? String(divisionCode) : '';
  const circleStr = circleCode ? String(circleCode) : '';

  if (circleStr) {
    const mappedCircle = getMappedCircle(circleStr);
    if (mappedCircle) {
      const mappedDiv = mappedCircle.divisions.find(d => 
        d.code === divStr || 
        d.code.endsWith(divStr) ||
        (divStr.length === 1 && d.code === mappedCircle.code + divStr)
      );
      if (mappedDiv) {
        const sub = mappedDiv.subdivisions.find(s => 
          s.code === subStr || 
          s.code.endsWith(subStr) ||
          (subStr.length === 1 && s.code === mappedDiv.code + subStr)
        );
        if (sub) return sub.name;
      }
      
      for (const d of mappedCircle.divisions) {
        const sub = d.subdivisions.find(s => 
          s.code === subStr || 
          s.code.endsWith(subStr) ||
          (subStr.length === 1 && s.code === d.code + subStr)
        );
        if (sub) return sub.name;
      }
    }
  }

  // Backwards compatibility global search
  for (const c of PESCO_HIERARCHY) {
    for (const d of c.divisions) {
      const sub = d.subdivisions.find(s => 
        s.code === subStr || 
        s.code.endsWith(subStr) ||
        (subStr.length === 1 && s.code === d.code + subStr)
      );
      if (sub) return sub.name;
    }
  }

  return `Sub-Div ${subStr}`;
}

/**
 * Formats a Date or timestamp string in Pakistan Standard Time (PKT) (UTC+5).
 */
export function formatPKTDateTime(dateInput?: Date | string | number): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' PKT';
}

/**
 * Formats a Date as human-readable in Pakistan Standard Time (PKT).
 */
export function formatPKTDate(dateInput?: Date | string | number): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a time portion in Pakistan Standard Time (PKT).
 */
export function formatPKTTime(dateInput?: Date | string | number): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' PKT';
}

/**
 * Returns current Date in Pakistan Standard Time (PKT) as a ISO-like string
 */
export function getPKTISOString(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${find('year')}-${find('month')}-${find('day')}T${find('hour')}:${find('minute')}:${find('second')}+05:00`;
}

/**
 * Returns current Date string yyyy-mm-dd in Pakistan Standard Time (PKT)
 */
export function getPKTDateString(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find(p => p.type === type)?.value || '01';
  return `${find('year')}-${find('month')}-${find('day')}`;
}

/**
 * Automap user role and designation as per their circle codes.
 */
export function getRoleFromCircleCode(circleCode: string | undefined): { role: string; designation: string } {
  if (!circleCode) {
    return { role: 'circle_supervisor', designation: 'PESCO Circle Officer' };
  }
  const cleanCode = String(circleCode).trim();
  switch (cleanCode) {
    case '261':
      return { role: 'lab_manager', designation: 'Laboratory Executive & Manager (Peshawar)' };
    case '262':
      return { role: 'testing_engineer', designation: 'Senior Testing Field Engineer (Khyber)' };
    case '263':
      return { role: 'data_entry_operator', designation: 'Laboratory Intake Officer (Mardan)' };
    case '266':
      return { role: 'administrator', designation: 'System Administrator (Swat)' };
    case '265':
      return { role: 'circle_supervisor', designation: 'PESCO Circle Officer (Bannu)' };
    case '268':
      return { role: 'circle_supervisor', designation: 'PESCO Circle Officer (Hazara)' };
    case '269':
      return { role: 'circle_supervisor', designation: 'PESCO Circle Officer (DIK)' };
    default:
      return { role: 'circle_supervisor', designation: `PESCO Circle Officer (${cleanCode})` };
  }
}



