import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'config', 'companies.json');
const comps = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const domains = {
  tcs: 'tcs.com',
  infosys: 'infosys.com',
  wipro: 'wipro.com',
  hcltech: 'hcltech.com',
  'tech-mahindra': 'techmahindra.com',
  cognizant: 'cognizant.com',
  accenture: 'accenture.com',
  capgemini: 'capgemini.com',
  ltimindtree: 'ltimindtree.com',
  mphasis: 'mphasis.com',
  hexaware: 'hexaware.com',
  persistent: 'persistent.com',
  coforge: 'coforge.com',
  birlasoft: 'birlasoft.com',
  virtusa: 'virtusa.com',
  cgi: 'cgi.com',
  dxc: 'dxc.com',
  nttdata: 'nttdata.com',
  deloitte: 'deloitte.com',
  ey: 'ey.com',
  kpmg: 'kpmg.com',
  pwc: 'pwc.com',
  amazon: 'amazon.com',
  microsoft: 'microsoft.com',
  google: 'google.com',
  meta: 'meta.com',
  apple: 'apple.com',
  adobe: 'adobe.com',
  oracle: 'oracle.com',
  sap: 'sap.com',
  salesforce: 'salesforce.com',
  ibm: 'ibm.com',
  cisco: 'cisco.com',
  intel: 'intel.com',
  nvidia: 'nvidia.com',
  qualcomm: 'qualcomm.com',
  paypal: 'paypal.com',
  walmart: 'walmart.com',
  servicenow: 'servicenow.com',
  broadcom: 'broadcom.com',
  zoho: 'zoho.com',
  freshworks: 'freshworks.com',
  razorpay: 'razorpay.com',
  phonepe: 'phonepe.com',
  flipkart: 'flipkart.com',
  swiggy: 'swiggy.com',
  zomato: 'zomato.com',
  groww: 'groww.in',
  cred: 'cred.club',
  zerodha: 'zerodha.com',
  juspay: 'juspay.in'
};

const updated = comps.map(c => {
  let dom = domains[c.id];
  if (!dom && c.website) {
    try {
      dom = new URL(c.website).hostname.replace(/^www\./, '');
    } catch (e) {
      dom = `${c.id}.com`;
    }
  }
  if (!dom) dom = `${c.id}.com`;
  return {
    ...c,
    logoUrl: `https://www.google.com/s2/favicons?domain=${dom}&sz=128`
  };
});

fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2));
console.log('Successfully updated', updated.length, 'companies with logoUrl!');
