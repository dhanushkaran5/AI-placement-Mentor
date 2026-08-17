import React, { useState } from 'react';

// Domain helper for all 51 target tech companies
const COMPANY_DOMAINS = {
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

// Brand gradient fallback palettes
const BRAND_GRADIENTS = {
  tcs: 'from-blue-700 to-indigo-900 text-white',
  infosys: 'from-blue-600 to-sky-800 text-white',
  wipro: 'from-purple-600 to-indigo-800 text-white',
  google: 'from-red-500 via-yellow-500 to-blue-600 text-white font-extrabold',
  amazon: 'from-amber-600 to-slate-900 text-amber-300',
  microsoft: 'from-blue-500 to-teal-600 text-white',
  meta: 'from-blue-600 to-indigo-600 text-white',
  apple: 'from-slate-700 to-slate-950 text-slate-100',
  adobe: 'from-red-600 to-rose-900 text-white',
  nvidia: 'from-emerald-600 to-green-800 text-white',
  juspay: 'from-teal-600 to-emerald-900 text-emerald-100',
  zerodha: 'from-blue-500 to-cyan-700 text-white',
  cred: 'from-slate-900 to-black text-amber-400 border-amber-500/40',
  razorpay: 'from-blue-700 to-cyan-600 text-white',
  zoho: 'from-red-500 via-green-600 to-blue-600 text-white',
  flipkart: 'from-blue-600 to-amber-500 text-white',
  zomato: 'from-red-600 to-rose-700 text-white',
  swiggy: 'from-orange-500 to-amber-600 text-white'
};

export const CompanyLogo = ({ 
  company, 
  size = 'md', 
  className = '',
  showNameFallback = true 
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const companyId = (company?.id || company?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const companyName = company?.name || 'Company';
  const logoText = company?.logo || companyName.substring(0, 3).toUpperCase();

  // Determine domain
  let domain = COMPANY_DOMAINS[companyId];
  if (!domain && company?.website) {
    try {
      const url = new URL(company.website);
      domain = url.hostname.replace(/^www\./, '');
    } catch (e) {
      domain = null;
    }
  }
  if (!domain) {
    domain = `${companyId}.com`;
  }

  // Size variations
  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px] rounded-lg',
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-12 h-12 text-sm rounded-xl',
    lg: 'w-14 h-14 text-base rounded-2xl',
    xl: 'w-16 h-16 text-lg rounded-2xl'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const gradientClass = BRAND_GRADIENTS[companyId] || 'from-primary/20 via-primary/10 to-indigo-900/20 text-primary';

  // Primary image source (Google Favicon high-res 128px API)
  const primaryLogoUrl = company?.logoUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const fallbackLogoUrl = `https://logo.clearbit.com/${domain}`;

  return (
    <div 
      className={`relative flex items-center justify-center flex-shrink-0 border border-border/80 bg-surface shadow-sm overflow-hidden group ${currentSizeClass} ${className}`}
    >
      {!imgError ? (
        <img
          src={primaryLogoUrl}
          alt={`${companyName} Logo`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            // Try secondary fallback URL before giving up to styled text
            if (e.target.src !== fallbackLogoUrl) {
              e.target.src = fallbackLogoUrl;
            } else {
              setImgError(true);
            }
          }}
          className={`w-full h-full object-contain p-1.5 transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {/* Fallback Badge when image fails or is loading */}
      {(!imgLoaded || imgError) && (
        <div 
          className={`absolute inset-0 flex items-center justify-center font-black uppercase tracking-wider bg-gradient-to-br ${gradientClass}`}
        >
          <span>{logoText}</span>
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
