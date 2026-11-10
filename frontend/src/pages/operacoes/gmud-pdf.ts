import {
  CHANGE_TYPE_LABELS, CHANGE_TYPE_ORDER, PRIORITY_LABELS, PRIORITY_ORDER,
  PROGRESSION_LABELS, PROGRESSION_ORDER, formatDateBr, formatGmudNumber,
  type Gmud,
} from './gmud-types';

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const val = (value: string | null | undefined, fallback = '---') =>
  value && value.trim() ? escapeHtml(value) : fallback;

const check = (checked: boolean, label: string) => `( ${checked ? '<b class="x">X</b>' : '&nbsp;'} ) ${label.toUpperCase()}`;

const safeFileName = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase();

export function buildGmudHtml(g: Gmud, logoUrl: string): string {
  const title = `GMUD_${safeFileName(g.project_name).slice(0, 40)}_${formatGmudNumber(g.number)}`;
  const detail = (label: string, value: string | null) =>
    `<tr class="detail"><th class="lbl-light">${label}</th><td colspan="6" class="txt">${val(value)}</td></tr>`;
  const reference = (label: string, value: string | null) =>
    `<tr><th class="lbl-arrow">${label} =&gt;</th><td colspan="6" class="center">${val(value)}</td></tr>`;
  const impact = (label: string, benefit: string | null, risk: string | null) =>
    `<tr class="impact"><th class="lbl-impact">${label}</th><td colspan="3" class="center">${val(benefit, '')}</td><td colspan="3" class="center">${val(risk, '')}</td></tr>`;
  const approval = (label: string, name: string | null) =>
    `<tr class="approval"><th colspan="2" class="lbl-light right">${label}</th><td colspan="2"><b>${val(name, '')}</b></td><td class="sign"></td><td colspan="2"></td></tr>`;
  const complementary = (label: string, value: string | null) =>
    `<tr><th class="lbl-arrow">${label} =&gt;</th><td colspan="6">${val(value, '')}</td></tr>`;

  const generatedAt = new Date().toLocaleString('pt-BR');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif; color: #0C1921; margin: 0; background: #F0F1F4; }
  .page { width: 190mm; margin: 12px auto; background: #fff; padding: 6mm; border: 1px solid #555; }
  .head { display: flex; align-items: center; justify-content: space-between; padding: 2mm 1mm 3mm; border-bottom: 2px solid #3B5A78; margin-bottom: 1.5mm; }
  .head h1 { margin: 0; font-size: 17px; font-weight: 800; color: #2E5C8A; letter-spacing: .01em; }
  .head img { height: 26px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8.5px; }
  th, td { border: 1px solid #7F8C99; padding: 3px 5px; vertical-align: middle; word-wrap: break-word; }
  th { font-weight: 700; text-align: left; }
  .lbl { background: #3B5A78; color: #fff; text-transform: uppercase; text-align: right; }
  .lbl-light { background: #4F81BD; color: #fff; text-transform: uppercase; font-size: 8px; }
  .lbl-arrow { background: #fff; text-align: right; font-weight: 700; }
  .lbl-impact { background: #E9EEF4; color: #2E5C8A; text-transform: uppercase; }
  .bar { background: #3B5A78; color: #fff; text-align: center; text-transform: uppercase; font-weight: 700; padding: 5px; }
  .sub { background: #DCE6F1; color: #2E5C8A; text-align: center; text-transform: uppercase; font-weight: 700; }
  .opt { text-align: center; font-weight: 700; white-space: nowrap; font-size: 8px; }
  .x { color: #E31B1B; }
  .center { text-align: center; }
  .right { text-align: right; }
  .txt { white-space: pre-wrap; }
  tr.detail td, tr.detail th { height: 13mm; }
  tr.impact td, tr.impact th { height: 9mm; }
  tr.approval td, tr.approval th { height: 6.5mm; }
  .sign { background: #95B3D7; }
  .notes { color: #E31B1B; font-weight: 700; text-align: center; white-space: pre-wrap; height: 12mm; }
  .footer { margin-top: 2mm; font-size: 7px; color: #4A4A4A; text-align: right; }
  .toolbar { text-align: center; margin: 12px; }
  .toolbar button { background: #204294; color: #fff; border: 0; border-radius: 4px; padding: 8px 18px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; font-family: inherit; }
  @media print { body { background: #fff; } .page { margin: 0; border: 1px solid #555; width: auto; } .toolbar { display: none; } }
</style></head>
<body>
<div class="toolbar"><button onclick="window.print()">Gerar PDF</button></div>
<div class="page">
  <div class="head"><h1>PROPOSTA DE ALTERAÇÃO EM AMBIENTE - GMUD</h1><img src="${escapeHtml(logoUrl)}" alt="CCM"></div>
  <table>
    <colgroup><col style="width:21%"><col style="width:13%"><col style="width:13%"><col style="width:13%"><col style="width:13%"><col style="width:14%"><col style="width:13%"></colgroup>
    <tr><th class="lbl">Nome do Projeto</th><td colspan="4"><b>${val(g.project_name)}</b></td><th class="lbl">ID. Projeto</th><td class="center">${val(g.project_ref)}</td></tr>
    <tr><th class="lbl">Solicitante</th><td colspan="4">${val(g.requester)}</td><th class="lbl">Data</th><td class="center">${escapeHtml(formatDateBr(g.request_date))}</td></tr>
    <tr><th class="lbl">CNPJ</th><td colspan="4">${val(g.cnpj)}</td><th class="lbl">GMUD Nº.</th><td class="center">${formatGmudNumber(g.number)}</td></tr>
    <tr><th class="lbl">Contatos Linx</th><td colspan="4">${val(g.linx_contacts)}</td><th class="lbl">C.R.</th><td class="center">${val(g.cr)}</td></tr>
    <tr><th class="lbl">Prioridade</th>${PRIORITY_ORDER.map(p => `<td class="opt">${check(g.priority === p, PRIORITY_LABELS[p])}</td>`).join('')}<td colspan="3"></td></tr>
    <tr><th class="lbl">Natureza da Alteração</th>${CHANGE_TYPE_ORDER.map(c => `<td class="opt">${check(g.change_type === c, CHANGE_TYPE_LABELS[c])}</td>`).join('')}</tr>
    <tr><td colspan="7" class="bar">Detalhamento</td></tr>
    ${detail('Atividade principal:', g.main_activity)}
    ${detail('Por que essa alteração é necessária?', g.reason)}
    ${detail('Qual o resultado pretendido?', g.expected_result)}
    ${detail('Quais são tempos estimados para atividades?', g.estimated_time)}
    ${detail('Fatores adicionais:', g.additional_factors)}
    ${detail('Custos estimados:', g.estimated_costs)}
    <tr><td colspan="7" class="bar">Referências Técnicas</td></tr>
    ${reference('Notas de atualização', g.release_notes)}
    ${reference('Processo de atualização', g.update_process)}
    ${reference('Pré-requisitos', g.prerequisites)}
    <tr><th class="lbl-light">Impacto nas operações</th><td colspan="3" class="sub">Benefícios potenciais</td><td colspan="3" class="sub">Potenciais efeitos adversos</td></tr>
    ${impact('Cliente', g.impact_client_benefit, g.impact_client_risk)}
    ${impact('CCM', g.impact_ccm_benefit, g.impact_ccm_risk)}
    ${impact('Linx', g.impact_linx_benefit, g.impact_linx_risk)}
    ${impact('Outros', g.impact_other_benefit, g.impact_other_risk)}
    <tr><td colspan="7" class="bar">Observações Importantes</td></tr>
    <tr><td colspan="7" class="notes">${val(g.notes, '')}</td></tr>
    <tr><td colspan="7" class="bar">Informações Complementares</td></tr>
    <tr><th class="lbl-arrow">Progressão da Atividade =&gt;</th>${PROGRESSION_ORDER.map(p => `<td class="opt">${check(g.progression === p, PROGRESSION_LABELS[p])}${p === 'partial' ? ' =&gt;' : ''}</td>`).join('')}<td colspan="3">${g.progression === 'partial' ? val(g.progression_detail, '') : ''}</td></tr>
    ${complementary('1ª Validação da Atividade', g.validation_1)}
    ${complementary('2ª Validação da Atividade', g.validation_2)}
    ${complementary('Rollback', g.rollback_plan)}
    <tr><td colspan="7" class="bar">Aprovação</td></tr>
    ${approval('Cliente', g.approver_client)}
    ${approval('Linx', g.approver_linx)}
    ${approval('CCM', g.approver_ccm)}
  </table>
  <div class="footer">Gerado pelo Admsquad em ${escapeHtml(generatedAt)}</div>
</div>
<script>
  window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });
</script>
</body></html>`;
}

/** Opens the print window synchronously (avoids popup blockers) and fills it once data arrives. */
export function openGmudPrintWindow(): Window | null {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write('<p style="font-family:Arial,sans-serif;padding:24px;color:#4A4A4A">Gerando GMUD...</p>');
  }
  return win;
}

export function writeGmudPdf(win: Window, gmud: Gmud) {
  const logoUrl = `${window.location.origin}/logo-ccm-dark.png`;
  win.document.open();
  win.document.write(buildGmudHtml(gmud, logoUrl));
  win.document.close();
}
