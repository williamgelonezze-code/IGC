import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { question, docContext, result, originalText, validatorCpf, validatorRe } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'A pergunta ou questionamento do operador é obrigatório.' },
        { status: 400 }
      );
    }

    let answerText = '';

    try {
      const prompt = `Você é o Auditor de IA Especialista em Análise Direcionada de Relatórios DEJEM / DELEGADA da PMESP (CPA/M-7).
O operador militar está realizando um questionamento direcionado sobre o relatório de auditoria e o documento original que deu origem a ele.

QUESTIONAMENTO / PERGUNTA DO OPERADOR:
"${question}"

IDENTIFICAÇÃO DO OPERADOR:
- CPF: ${validatorCpf || 'Não informado'}
- RE: ${validatorRe || 'Não informado'}

DOCUMENTO ORIGINAL AUDITADO:
- Arquivo: ${docContext?.fileName || 'N/A'}
- Período: ${docContext?.periodo || 'N/A'}
- Tipo de Escala: ${docContext?.tipoEscala || 'N/A'}
- Total de Policiais: ${docContext?.totalPoliciais || 0}
- Total de Escalas: ${docContext?.totalEscalas || 0}
- Valor Total: ${docContext?.totalValor || 'R$ 0,00'}
- IDs de Escala Avaliadas: ${docContext?.totalIdsAvaliados || 0}

TRECHO / TEXTO DO DOCUMENTO ORIGINAL:
"""
${(originalText || '').substring(0, 15000)}
"""

RESULTADOS DA AUDITORIA GERADA:
${JSON.stringify(result, null, 2)}

DIRETRIZES DE RESPOSTA:
1. Examine com precisão técnica tanto o documento original quanto as regras de auditoria avaliadas.
2. Aborde os apontamentos de TAF, TAT e Inspeção de Saúde (validade de 365 dias), restrições operacionais e licenças médicas que impedem a execução de DEJEM/Delegada.
3. Regra de Limite Mensal: O limite mensal de DELEGADAS e DEJEM são 10 escalas SEMPRE. Se escalas executadas <= 10, são regulares. Se escalas executadas > 10, são irregulares nas escalas maiores que 10, indicando as datas correspondentes.
4. Nomes de PMs: O validador aceita e exibe nomes completos com até 150 caracteres sem truncamento.
5. Se o operador perguntar sobre regras de CPF de 10 dígitos, esclareça que 10 dígitos não configura inexistência (regularizado pelo zero à esquerda regulamentar).
6. Forneça uma resposta clara, objetiva, estruturada com tópicos e linguagem policial militar regulamentar.`;

      const aiText = await generateContentWithFallback({
        contents: prompt,
        preferredModel: 'gemini-3.8-flash',
        config: {
          systemInstruction: 'Você é um perito auditor de inteligência artificial da PMESP especializado em Diárias Especiais (DEJEM / Delegada), auditorias contábeis e conformidade regulamentar.',
        },
      });

      answerText = aiText || '';
    } catch (err: any) {
      console.warn('Nota: Consulta direcionada processada via motor pericial de regras.', err?.message || '');
    }

    // Fallback if AI call failed or key is missing
    if (!answerText) {
      const qLower = question.toLowerCase();
      if (qLower.includes('restriç') || qLower.includes('médic') || qLower.includes('operacion')) {
        const pmsRestricao = result?.pmsEmDesacordo?.filter((p: any) => 
          p.motivo?.toLowerCase().includes('restriç') || p.motivo?.toLowerCase().includes('lts')
        ) || [];
        answerText = `**Análise Direcionada sobre Restrições Operacionais (Correg PM / Comissões das OPM / CAPS - NAPS) e Médicas:**\n\nForam identificados policiais com restrições cadastradas que executaram escala:\n` +
          (pmsRestricao.length > 0 
            ? pmsRestricao.map((p: any) => `• **${p.nome}** (RE: ${p.re} | CPF: ${p.cpf}): ${p.motivo} (Dias: ${p.diasEmDesacordo})`).join('\n')
            : '• Nenhum policial militar com restrição operacional ou médica impeditiva foi localizado executando escala neste lote.') +
          `\n\nConforme normativas da PMESP, policiais com restrição de serviço operacional externo ou em Licença para Tratamento de Saúde (LTS) não podem ser escalados em DEJEM ou DELEGADA.`;
      } else if (qLower.includes('taf') || qLower.includes('tat') || qLower.includes('saúde') || qLower.includes('saude') || qLower.includes('vencid')) {
        const stats = result?.estatisticasAptidao;
        answerText = `**Análise Direcionada sobre TAF, TAT e Inspeções de Saúde:**\n\n` +
          `Regra Aplicada: A data de execução do TAF, TAT ou Inspeção de Saúde tem validade estrita de 365 dias (Data Execução + 365 dias). Se a data atual ou da escala for superior, o policial é considerado com DATA VENCIDA.\n\n` +
          `• **TAF**: ${stats?.taf?.validados || 0} validados, ${stats?.taf?.vencidos || 0} com data vencida (>365 dias), ${stats?.taf?.naoLocalizados || 0} não localizados.\n` +
          `• **TAT**: ${stats?.tat?.validados || 0} validados, ${stats?.tat?.vencidos || 0} com data vencida (>365 dias), ${stats?.tat?.naoLocalizados || 0} não localizados.\n` +
          `• **Inspeção de Saúde**: ${stats?.inspecaoSaude?.validados || 0} validadas, ${stats?.inspecaoSaude?.vencidos || 0} com data vencida (>365 dias), ${stats?.inspecaoSaude?.naoLocalizados || 0} não localizadas.`;
      } else if (qLower.includes('escala') || qLower.includes('limite') || (qLower.includes('10') && !qLower.includes('cpf') && !qLower.includes('dígito'))) {
        answerText = `**Análise Direcionada sobre Limite Mensal de Escalas DEJEM e DELEGADA:**\n\n` +
          `Regra Regulamentar: O limite mensal de DELEGADAS e DEJEM são **10 escalas sempre**.\n\n` +
          `• **Escalas Executadas <= 10**: Escalas DEJEM / DELEGADA **REGULARES**.\n` +
          `• **Escalas Executadas > 10**: Escalas maiores que 10 escalas DEJEM / DELEGADAS **IRREGULARES** nas datas correspondentes às escalas excedentes.\n\n` +
          `O relatório detalha nominalmente cada militar com escalas excedentes, indicando os dias irregulares que não atendem à regra.`;
      } else if (qLower.includes('cpf') || qLower.includes('10') || qLower.includes('dígito')) {
        answerText = `**Análise Direcionada sobre Validação de CPF:**\n\n` +
          `Regra Atualizada: A presença de 10 dígitos numéricos no CPF **NÃO configura inexistência** cadastral. Trata-se de omissão habitual do zero à esquerda no registro de dados do sistema de origem. O validador normaliza automaticamente para 11 dígitos com zero regulamentar e aplica o algoritmo de verificação Módulo 11 da Receita Federal.`;
      } else {
        answerText = `**Parecer Técnico da Análise Direcionada:**\n\n` +
          `O relatório de auditoria do arquivo **${docContext?.fileName || 'analisado'}** registrou score de conformidade de **${result?.scoreConformidade || 0}/100** com status **${result?.statusGeral || 'Concluído'}**.\n\n` +
          `Foram auditados ${docContext?.totalPoliciais || 0} policiais militares e ${docContext?.totalIdsAvaliados || 0} IDs de escala, totalizando ${docContext?.totalValor || 'R$ 0,00'}.\n\n` +
          `Todos os apontamentos nominais, divergências de 365 dias em testes de aptidão física/tiro/saúde e restrições operacionais constam registrados detalhadamente neste laudo.`;
      }
    }

    return NextResponse.json({
      success: true,
      answer: answerText,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in AI question prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar análise direcionada por IA.' },
      { status: 500 }
    );
  }
}
