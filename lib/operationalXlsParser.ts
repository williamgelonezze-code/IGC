/**
 * Parser for Operational XLS Spreadsheets stored in Cloud SQL SGBD
 * Supports XML Spreadsheet 2003 (<Worksheet>, <Row>, <Cell>), HTML table XLS, CSV, and tabular data
 */

export interface OperationalSpreadsheetRow {
  data: string;
  unidade: string;
  modalidade: string;
  efetivo: number;
  viaturas: number;
  abordagens: number;
  veiculosFiscalizados: number;
  flagrantes: number;
  procurados: number;
  armas?: number;
  entorpecentes?: number;
}

export interface OperationalAnalysisExtractedData {
  title: string;
  monthYear: string;
  totalLinhas: number;
  totalEfetivo: number;
  totalViaturas: number;
  totalAbordagens: number;
  totalVeiculosFiscalizados: number;
  totalFlagrantes: number;
  totalProcurados: number;
  taxaAbordagemPorPm: number;
  taxaEficaciaPrisoes: number; // Flagrantes + Procurados por viatura ou abordagem
  batalhoes: {
    [key: string]: {
      nome: string;
      linhas: number;
      efetivo: number;
      viaturas: number;
      abordagens: number;
      veiculosFiscalizados: number;
      flagrantes: number;
      procurados: number;
      modalidades: { [key: string]: number };
    };
  };
  linhasDetalhadas: OperationalSpreadsheetRow[];
}

export function parseOperationalXlsContent(content: string): OperationalAnalysisExtractedData {
  // If base64 encoded, decode it
  let rawText = content;
  if (content.startsWith('data:') && content.includes(',')) {
    const base64Part = content.split(',')[1];
    try {
      rawText = Buffer.from(base64Part, 'base64').toString('utf-8');
    } catch {
      rawText = content;
    }
  } else if (!content.includes('<') && !content.includes('\n') && content.length > 100) {
    try {
      rawText = Buffer.from(content, 'base64').toString('utf-8');
    } catch {
      rawText = content;
    }
  }

  const result: OperationalAnalysisExtractedData = {
    title: 'Dados Operacionais e Produtividade Policial Militar',
    monthYear: 'Período Corrente',
    totalLinhas: 0,
    totalEfetivo: 0,
    totalViaturas: 0,
    totalAbordagens: 0,
    totalVeiculosFiscalizados: 0,
    totalFlagrantes: 0,
    totalProcurados: 0,
    taxaAbordagemPorPm: 0,
    taxaEficaciaPrisoes: 0,
    batalhoes: {},
    linhasDetalhadas: [],
  };

  // Try extracting title from XML Spreadsheet 2003
  const titleMatch = rawText.match(/<Data ss:Type="String">([^<]+?(?:Consolidado|RAC|CPA\/M-7|Operações|Produtividade)[^<]*?)<\/Data>/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  const monthMatch = rawText.match(/(?:JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO|JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO)\s*\/?\s*202\d/i);
  if (monthMatch) {
    result.monthYear = monthMatch[0].trim().toUpperCase();
  }

  // Extract rows from XML format: <Row> ... <Cell ...><Data ss:Type="...">VALUE</Data></Cell> ... </Row>
  const rowRegex = /<Row(?:[^>]*)>([\s\S]*?)<\/Row>/gi;
  const rows = [...rawText.matchAll(rowRegex)];

  for (const row of rows) {
    const rowContent = row[1];
    const cellRegex = /<Cell(?:[^>]*)>(?:[\s\S]*?)<Data(?:[^>]*)>([\s\S]*?)<\/Data>(?:[\s\S]*?)<\/Cell>/gi;
    const cells = [...rowContent.matchAll(cellRegex)].map(c => c[1].trim());

    if (cells.length >= 6) {
      // Check if this is a header row
      const firstCell = cells[0].toUpperCase();
      if (firstCell.includes('DATA') || firstCell.includes('UNIDADE') || firstCell.includes('POLÍCIA') || firstCell.includes('TOTAL')) {
        continue;
      }

      // Format expected: [DATA, UNIDADE, MODALIDADE, EFETIVO, VIATURAS, ABORDADAS, VEICULOS, FLAGRANTES, PROCURADOS]
      const dataStr = cells[0] || '';
      const unidade = cells[1] || 'CPA/M-7';
      const modalidade = cells[2] || 'Policiamento Geral';
      const efetivo = parseInt(cells[3]?.replace(/[^\d]/g, '') || '0', 10);
      const viaturas = parseInt(cells[4]?.replace(/[^\d]/g, '') || '0', 10);
      const abordagens = parseInt(cells[5]?.replace(/[^\d]/g, '') || '0', 10);
      const veiculos = parseInt(cells[6]?.replace(/[^\d]/g, '') || '0', 10);
      const flagrantes = parseInt(cells[7]?.replace(/[^\d]/g, '') || '0', 10);
      const procurados = parseInt(cells[8]?.replace(/[^\d]/g, '') || '0', 10);

      // Only count if there's reasonable operational data
      if (efetivo > 0 || viaturas > 0 || abordagens > 0) {
        result.totalLinhas++;
        result.totalEfetivo += efetivo;
        result.totalViaturas += viaturas;
        result.totalAbordagens += abordagens;
        result.totalVeiculosFiscalizados += veiculos;
        result.totalFlagrantes += flagrantes;
        result.totalProcurados += procurados;

        const rowItem: OperationalSpreadsheetRow = {
          data: dataStr,
          unidade,
          modalidade,
          efetivo,
          viaturas,
          abordagens,
          veiculosFiscalizados: veiculos,
          flagrantes,
          procurados,
        };
        result.linhasDetalhadas.push(rowItem);

        // Group by Battalion
        const bKey = unidade.trim() || 'Geral';
        if (!result.batalhoes[bKey]) {
          result.batalhoes[bKey] = {
            nome: bKey,
            linhas: 0,
            efetivo: 0,
            viaturas: 0,
            abordagens: 0,
            veiculosFiscalizados: 0,
            flagrantes: 0,
            procurados: 0,
            modalidades: {},
          };
        }
        const b = result.batalhoes[bKey];
        b.linhas++;
        b.efetivo += efetivo;
        b.viaturas += viaturas;
        b.abordagens += abordagens;
        b.veiculosFiscalizados += veiculos;
        b.flagrantes += flagrantes;
        b.procurados += procurados;
        b.modalidades[modalidade] = (b.modalidades[modalidade] || 0) + 1;
      }
    }
  }

  // If no rows parsed via XML, attempt CSV / Tab separated parsing
  if (result.totalLinhas === 0) {
    const lines = rawText.split(/\r?\n/);
    for (const line of lines) {
      const parts = line.split(/[;\t,]/).map(p => p.trim());
      if (parts.length >= 6) {
        const first = parts[0].toUpperCase();
        if (first.includes('DATA') || first.includes('POLICIA') || first.includes('UNIDADE')) continue;

        const efetivo = parseInt(parts[3] || '0', 10);
        const viaturas = parseInt(parts[4] || '0', 10);
        const abordagens = parseInt(parts[5] || '0', 10);
        const veiculos = parseInt(parts[6] || '0', 10);
        const flagrantes = parseInt(parts[7] || '0', 10);
        const procurados = parseInt(parts[8] || '0', 10);

        if (efetivo > 0 || viaturas > 0 || abordagens > 0) {
          result.totalLinhas++;
          result.totalEfetivo += efetivo;
          result.totalViaturas += viaturas;
          result.totalAbordagens += abordagens;
          result.totalVeiculosFiscalizados += veiculos;
          result.totalFlagrantes += flagrantes;
          result.totalProcurados += procurados;

          const rowItem: OperationalSpreadsheetRow = {
            data: parts[0],
            unidade: parts[1] || 'CPA/M-7',
            modalidade: parts[2] || 'Policiamento',
            efetivo,
            viaturas,
            abordagens,
            veiculosFiscalizados: veiculos,
            flagrantes,
            procurados,
          };
          result.linhasDetalhadas.push(rowItem);

          const bKey = rowItem.unidade;
          if (!result.batalhoes[bKey]) {
            result.batalhoes[bKey] = {
              nome: bKey,
              linhas: 0,
              efetivo: 0,
              viaturas: 0,
              abordagens: 0,
              veiculosFiscalizados: 0,
              flagrantes: 0,
              procurados: 0,
              modalidades: {},
            };
          }
          const b = result.batalhoes[bKey];
          b.linhas++;
          b.efetivo += efetivo;
          b.viaturas += viaturas;
          b.abordagens += abordagens;
          b.veiculosFiscalizados += veiculos;
          b.flagrantes += flagrantes;
          b.procurados += procurados;
        }
      }
    }
  }

  // Calculate analytical indicators
  if (result.totalEfetivo > 0) {
    result.taxaAbordagemPorPm = Number((result.totalAbordagens / result.totalEfetivo).toFixed(2));
  }
  const totalPrisoes = result.totalFlagrantes + result.totalProcurados;
  if (result.totalAbordagens > 0) {
    result.taxaEficaciaPrisoes = Number(((totalPrisoes / result.totalAbordagens) * 100).toFixed(2));
  }

  return result;
}
