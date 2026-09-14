export function generateSampleOperationalXls(title: string, monthYear: string): string {
  const content = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Div Op - CPA/M-7</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>Polícia Militar do Estado de São Paulo</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="13" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="DADOS OPERACIONAIS">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="160"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO - CPA/M-7</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">${title} - ${monthYear}</Data></Cell>
   </Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">DATA</Data></Cell>
    <Cell><Data ss:Type="String">UNIDADE / BATALHÃO</Data></Cell>
    <Cell><Data ss:Type="String">MODALIDADE OPERACIONAL</Data></Cell>
    <Cell><Data ss:Type="String">EFETIVO PM</Data></Cell>
    <Cell><Data ss:Type="String">VIATURAS</Data></Cell>
    <Cell><Data ss:Type="String">PESSOAS ABORDADAS</Data></Cell>
    <Cell><Data ss:Type="String">VEÍCULOS FISCALIZADOS</Data></Cell>
    <Cell><Data ss:Type="String">FLAGRANTES</Data></Cell>
    <Cell><Data ss:Type="String">PROCURADOS</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">01/06/2026</Data></Cell>
    <Cell><Data ss:Type="String">15º BPM/M (Guarulhos)</Data></Cell>
    <Cell><Data ss:Type="String">Operação ADAGA XV</Data></Cell>
    <Cell><Data ss:Type="Number">48</Data></Cell>
    <Cell><Data ss:Type="Number">22</Data></Cell>
    <Cell><Data ss:Type="Number">315</Data></Cell>
    <Cell><Data ss:Type="Number">180</Data></Cell>
    <Cell><Data ss:Type="Number">4</Data></Cell>
    <Cell><Data ss:Type="Number">2</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">02/06/2026</Data></Cell>
    <Cell><Data ss:Type="String">26º BPM/M (Franco da Rocha)</Data></Cell>
    <Cell><Data ss:Type="String">Força Tática / DEJEM</Data></Cell>
    <Cell><Data ss:Type="Number">36</Data></Cell>
    <Cell><Data ss:Type="Number">16</Data></Cell>
    <Cell><Data ss:Type="Number">240</Data></Cell>
    <Cell><Data ss:Type="Number">145</Data></Cell>
    <Cell><Data ss:Type="Number">2</Data></Cell>
    <Cell><Data ss:Type="Number">1</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">03/06/2026</Data></Cell>
    <Cell><Data ss:Type="String">31º BPM/M (Guarulhos Sul)</Data></Cell>
    <Cell><Data ss:Type="String">Operação Alta Visibilidade</Data></Cell>
    <Cell><Data ss:Type="Number">52</Data></Cell>
    <Cell><Data ss:Type="Number">24</Data></Cell>
    <Cell><Data ss:Type="Number">420</Data></Cell>
    <Cell><Data ss:Type="Number">290</Data></Cell>
    <Cell><Data ss:Type="Number">5</Data></Cell>
    <Cell><Data ss:Type="Number">3</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">04/06/2026</Data></Cell>
    <Cell><Data ss:Type="String">44º BPM/M (Guarulhos Norte)</Data></Cell>
    <Cell><Data ss:Type="String">Rondas Preventivas / DEJEM</Data></Cell>
    <Cell><Data ss:Type="Number">40</Data></Cell>
    <Cell><Data ss:Type="Number">18</Data></Cell>
    <Cell><Data ss:Type="Number">285</Data></Cell>
    <Cell><Data ss:Type="Number">160</Data></Cell>
    <Cell><Data ss:Type="Number">3</Data></Cell>
    <Cell><Data ss:Type="Number">1</Data></Cell>
   </Row>
   <Row ss:StyleID="Total">
    <Cell><Data ss:Type="String">TOTAL CONSOLIDADO</Data></Cell>
    <Cell><Data ss:Type="String">CPA/M-7</Data></Cell>
    <Cell><Data ss:Type="String">Geral Operações</Data></Cell>
    <Cell><Data ss:Type="Number">176</Data></Cell>
    <Cell><Data ss:Type="Number">80</Data></Cell>
    <Cell><Data ss:Type="Number">1260</Data></Cell>
    <Cell><Data ss:Type="Number">775</Data></Cell>
    <Cell><Data ss:Type="Number">14</Data></Cell>
    <Cell><Data ss:Type="Number">7</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const base64 = Buffer.from(content, 'utf-8').toString('base64');
  return `data:application/vnd.ms-excel;base64,${base64}`;
}

export function generateSampleCapOperationalXlsWithBO(): string {
  const content = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Div Op - CPA/M-7</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>Polícia Militar do Estado de São Paulo</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E1B4B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="13" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="DADOS CAP OCORRENCIAS">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="90"/>
   <Column ss:Width="160"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="320"/>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO - CPA/M-7</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">DADOS OPERACIONAIS CAP - BOLETIM DE OCORRÊNCIA E HISTÓRICOS</Data></Cell>
   </Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">NumeroBO</Data></Cell>
    <Cell><Data ss:Type="String">Data</Data></Cell>
    <Cell><Data ss:Type="String">Unidade</Data></Cell>
    <Cell><Data ss:Type="String">Modalidade</Data></Cell>
    <Cell><Data ss:Type="String">Viatura</Data></Cell>
    <Cell><Data ss:Type="String">EfetivoRE</Data></Cell>
    <Cell><Data ss:Type="String">Natureza</Data></Cell>
    <Cell><Data ss:Type="String">Historico</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00125</Data></Cell>
    <Cell><Data ss:Type="String">01/06/2026 09:30</Data></Cell>
    <Cell><Data ss:Type="String">15º BPM/M (Guarulhos)</Data></Cell>
    <Cell><Data ss:Type="String">Força Tática</Data></Cell>
    <Cell><Data ss:Type="String">M-15012</Data></Cell>
    <Cell><Data ss:Type="String">123.456-7</Data></Cell>
    <Cell><Data ss:Type="String">Tráfico de Drogas</Data></Cell>
    <Cell><Data ss:Type="String">Equipe em patrulhamento tático visualizou dois indivíduos em fundada suspeita repassando invólucros plásticos.</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00128</Data></Cell>
    <Cell><Data ss:Type="String">01/06/2026 10:15</Data></Cell>
    <Cell><Data ss:Type="String">26º BPM/M (Franco da Rocha)</Data></Cell>
    <Cell><Data ss:Type="String">Rádio Patrulha</Data></Cell>
    <Cell><Data ss:Type="String">M-26105</Data></Cell>
    <Cell><Data ss:Type="String">134.567-8</Data></Cell>
    <Cell><Data ss:Type="String">Apreensão de Veículo</Data></Cell>
    <Cell><Data ss:Type="String">Veículo produto de roubo localizado estacionado em via pública sem ocupantes, guinchado ao DP.</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00125</Data></Cell>
    <Cell><Data ss:Type="String">01/06/2026 11:10</Data></Cell>
    <Cell><Data ss:Type="String">15º BPM/M (Guarulhos)</Data></Cell>
    <Cell><Data ss:Type="String">Força Tática</Data></Cell>
    <Cell><Data ss:Type="String">M-15012</Data></Cell>
    <Cell><Data ss:Type="String">123.456-7</Data></Cell>
    <Cell><Data ss:Type="String">Tráfico de Drogas</Data></Cell>
    <Cell><Data ss:Type="String">Averiguação no local de mata próxima resultou na localização de sacola contendo 45 ependorfs de cocaína e 22 porções de maconha.</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00130</Data></Cell>
    <Cell><Data ss:Type="String">02/06/2026 14:00</Data></Cell>
    <Cell><Data ss:Type="String">31º BPM/M (Guarulhos Sul)</Data></Cell>
    <Cell><Data ss:Type="String">DEJEM</Data></Cell>
    <Cell><Data ss:Type="String">M-31010</Data></Cell>
    <Cell><Data ss:Type="String">145.678-9</Data></Cell>
    <Cell><Data ss:Type="String">Roubo Transeunte</Data></Cell>
    <Cell><Data ss:Type="String">Vítima acionou viatura informando roubo de celular por indivíduo em bicicleta.</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00125</Data></Cell>
    <Cell><Data ss:Type="String">01/06/2026 12:45</Data></Cell>
    <Cell><Data ss:Type="String">15º BPM/M (Guarulhos)</Data></Cell>
    <Cell><Data ss:Type="String">Força Tática</Data></Cell>
    <Cell><Data ss:Type="String">M-15012</Data></Cell>
    <Cell><Data ss:Type="String">123.456-7</Data></Cell>
    <Cell><Data ss:Type="String">Tráfico de Drogas</Data></Cell>
    <Cell><Data ss:Type="String">Apresentação no 1º Distrito Policial de Guarulhos onde a autoridade ratificou o flagrante de tráfico de entorpecentes e apreendeu R$ 380 em notas miúdas.</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00135</Data></Cell>
    <Cell><Data ss:Type="String">03/06/2026 18:20</Data></Cell>
    <Cell><Data ss:Type="String">44º BPM/M (Guarulhos Norte)</Data></Cell>
    <Cell><Data ss:Type="String">Rondas Periódicas</Data></Cell>
    <Cell><Data ss:Type="String">M-44203</Data></Cell>
    <Cell><Data ss:Type="String">156.789-0</Data></Cell>
    <Cell><Data ss:Type="String">Captura de Procurado</Data></Cell>
    <Cell><Data ss:Type="String">Abordagem de indivíduo e após consulta COPOM constatou-se mandado de prisão preventiva em aberto pelo Art. 155.</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">BO-2026/00130</Data></Cell>
    <Cell><Data ss:Type="String">02/06/2026 15:30</Data></Cell>
    <Cell><Data ss:Type="String">31º BPM/M (Guarulhos Sul)</Data></Cell>
    <Cell><Data ss:Type="String">DEJEM</Data></Cell>
    <Cell><Data ss:Type="String">M-31010</Data></Cell>
    <Cell><Data ss:Type="String">145.678-9</Data></Cell>
    <Cell><Data ss:Type="String">Roubo Transeunte</Data></Cell>
    <Cell><Data ss:Type="String">Indivíduo detido em cerco policial com o aparelho celular da vítima e simulacro de pistola, conduzido ao 4º DP.</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const base64 = Buffer.from(content, 'utf-8').toString('base64');
  return `data:application/vnd.ms-excel;base64,${base64}`;
}

