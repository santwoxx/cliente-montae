import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Windows\\.gemini\\antigravity-ide\\brain\\8c2dcc0d-a51c-4c63-ab88-2ae331ac8a92';

async function runTest() {
  console.log('Iniciando navegador Microsoft Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('PÁGINA ERRO CONSOLE:', msg.text());
    } else {
      console.log('CONSOLE:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('ERRO JS NÃO TRATADO:', err.message);
  });

  console.log('Navegando para http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Dashboard
  console.log('Capturando Dashboard...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_montae_dashboard.png') });

  // 2. Ordens & Montagens
  console.log('Navegando para Ordens & Montagens...');
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Ordens & Montagens')) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_montae_ordens.png') });

  // 3. Comprovante & Garantia
  console.log('Abrindo Comprovante com 2 Assinaturas Digitais...');
  const comprovanteBtn = await page.$('button.btn-outline-gold');
  if (comprovanteBtn) {
    await comprovanteBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_montae_comprovante_garantia.png') });
    
    // Close modal
    const closeBtn = await page.$('.modal-header .btn-secondary');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Gerar Link Orçamento
  console.log('Abrindo Modal de Gerar Link de Orçamento...');
  const shareBtn = await page.$('header .btn-primary');
  if (shareBtn) {
    await shareBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_montae_gerador_link_orcamento.png') });

    const closeBtn = await page.$('.modal-header .btn-secondary');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // 5. Painel do Montador
  console.log('Navegando para Painel do Montador...');
  for (const tab of await page.$$('.nav-tab')) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Painel do Montador')) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_montae_painel_montador.png') });

  // Open order for dual signatures in assembler panel
  console.log('Abrindo OS no painel do montador para coleta de assinaturas...');
  const cards = await page.$$('.assembler-container .card');
  if (cards.length > 1) {
    await cards[1].click();
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_montae_assinatura_dupla_campo.png') });
  }

  // Clientes CRM
  console.log('Navegando para Clientes (CRM)...');
  for (const tab of await page.$$('.nav-tab')) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Clientes (CRM)')) {
      await tab.click();
      break;
    }
  }
  await page.evaluate(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_montae_clientes_crm.png') });

  // 6. Link do Cliente (Simulador Público)
  console.log('Navegando para Link do Cliente...');
  for (const tab of await page.$$('.nav-tab')) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Link do Cliente')) {
      await tab.click();
      break;
    }
  }
  await page.evaluate(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_montae_link_publico_cliente.png') });

  // 7. Financeiro
  console.log('Navegando para Financeiro...');
  for (const tab of await page.$$('.nav-tab')) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Financeiro')) {
      await tab.click();
      break;
    }
  }
  await page.evaluate(() => {
    const wider = [];
    document.querySelectorAll('.app-layout *').forEach(el => {
      if (el.scrollWidth > document.documentElement.clientWidth) {
        wider.push({ tag: el.tagName, class: el.className, scrollWidth: el.scrollWidth, clientWidth: document.documentElement.clientWidth });
      }
    });
    console.log('ELEMENTOS LARGOS:', JSON.stringify(wider));

    document.querySelectorAll('*').forEach(el => {
      if (el.scrollLeft > 0) {
        el.scrollLeft = 0;
      }
    });
    window.scrollTo(0, 0);
    document.body.scrollLeft = 0;
    document.documentElement.scrollLeft = 0;
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_montae_financeiro_fluxo_caixa.png') });

  console.log('✓ Todos os testes e screenshots concluídos com sucesso!');
  await browser.close();
}

runTest().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
