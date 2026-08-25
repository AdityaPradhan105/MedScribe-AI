const puppeteer = require('puppeteer');

/**
 * Generates a clean PDF representation of the simplified prescription
 */
const generatePrescriptionPDF = async (prescription) => {
  const content = prescription.simplifiedContent;
  const lang = prescription.language || 'en';
  
  // Localized title & columns
  const titles = {
    en: {
      header: 'Rural Healthcare Assistant - Simplified Prescription',
      patient: 'Patient Name',
      doctor: 'Doctor / Clinic',
      date: 'Prescription Date',
      medName: 'Medicine Name',
      generic: 'Chemical Name',
      purpose: 'What it does (Purpose)',
      dosage: 'Dosage',
      freq: 'Frequency',
      timing: 'Timing',
      dur: 'Duration',
      instructions: 'Special Instructions',
      sideEffects: 'Side Effects',
      advice: 'General Health Advice',
      emergency: 'Red Flag Symptoms (Emergency)',
      footer: 'Disclaimer: This report is an AI-simplified version of your prescription. Always keep the original copy and consult your doctor.'
    },
    hi: {
      header: 'ग्रामीण स्वास्थ्य सहायक - सरलीकृत पर्ची',
      patient: 'मरीज का नाम',
      doctor: 'डॉक्टर / क्लिनिक',
      date: 'पर्ची की तारीख',
      medName: 'दवा का नाम',
      generic: 'रासायनिक नाम (Generic)',
      purpose: 'दवा किस लिए है (काम)',
      dosage: 'मात्रा (खुराक)',
      freq: 'कितनी बार',
      timing: 'कब लें',
      dur: 'कब तक लें',
      instructions: 'विशेष निर्देश',
      sideEffects: 'दुष्प्रभाव (Side Effects)',
      advice: 'सामान्य स्वास्थ्य सलाह',
      emergency: 'आपातकालीन लक्षण (खतरे के संकेत)',
      footer: 'अस्वीकरण: यह रिपोर्ट आपकी पर्ची का एआई-सरलीकृत संस्करण है। हमेशा मूल पर्ची सुरक्षित रखें और डॉक्टर से सलाह लें।'
    }
  };

  const labels = titles[lang] || titles['en'];

  // Map medicines array to HTML rows
  const medRows = content.medicines.map((med, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">
        ${med.name}<br>
        <span style="font-size: 0.8rem; font-weight: normal; color: #6b7280; font-style: italic;">
          (${med.genericName || 'Generic'})
        </span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">${med.purposeSimple || ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">${med.dosage || ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">${med.frequency || ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${med.timing || ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151;">${med.duration || ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 0.85rem; color: #b91c1c;">
        ${med.instructions || '-'}<br>
        <span style="font-size: 0.75rem; color: #6b7280;">
          ${med.sideEffects ? med.sideEffects.join(', ') : ''}
        </span>
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>Prescription Summary</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1f2937;
          background-color: #ffffff;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #10b981;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header-title {
          font-size: 1.8rem;
          color: #065f46;
          font-weight: 700;
          margin: 0;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .meta-item {
          font-size: 0.95rem;
        }
        .meta-label {
          font-weight: 600;
          color: #4b5563;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        th {
          background-color: #10b981;
          color: white;
          text-align: left;
          padding: 12px 10px;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .section-title {
          font-size: 1.25rem;
          color: #065f46;
          border-left: 4px solid #10b981;
          padding-left: 8px;
          margin-bottom: 12px;
          margin-top: 25px;
          font-weight: 600;
        }
        .box {
          padding: 15px;
          border-radius: 8px;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .advice-box {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        .danger-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px dashed #d1d5db;
          padding-top: 15px;
          font-size: 0.8rem;
          color: #9ca3af;
          text-align: center;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 class="header-title">${labels.header}</h1>
            <div style="font-size: 0.85rem; color: #10b981; margin-top: 4px; font-weight: 500;">
              MedScribe AI Rural Healthcare Support System
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; color: #10b981; font-size: 1.2rem;">MEDSCRIBE AI</div>
            <div style="font-size: 0.75rem; color: #6b7280;">Digital Health Portal</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">${labels.patient}:</span> ${content.patientName || 'N/A'}
          </div>
          <div class="meta-item" style="text-align: right;">
            <span class="meta-label">${labels.date}:</span> ${content.date || 'N/A'}
          </div>
          <div class="meta-item" style="grid-column: span 2;">
            <span class="meta-label">${labels.doctor}:</span> ${content.doctorName || 'N/A'}
          </div>
        </div>

        <div class="section-title">${labels.medName}s</div>
        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px;">${labels.medName}</th>
              <th>${labels.purpose}</th>
              <th>${labels.dosage}</th>
              <th>${labels.freq}</th>
              <th>${labels.timing}</th>
              <th>${labels.dur}</th>
              <th style="border-top-right-radius: 6px;">${labels.instructions}</th>
            </tr>
          </thead>
          <tbody>
            ${medRows}
          </tbody>
        </table>

        ${content.generalAdvice ? `
          <div class="section-title">${labels.advice}</div>
          <div class="box advice-box">
            ${content.generalAdvice}
          </div>
        ` : ''}

        ${content.emergencyInstructions ? `
          <div class="section-title" style="color: #b91c1c; border-left-color: #ef4444;">${labels.emergency}</div>
          <div class="box danger-box">
            ${content.emergencyInstructions}
          </div>
        ` : ''}

        <div class="footer">
          ${labels.footer}
        </div>
      </div>
    </body>
    </html>
  `;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    console.error('Puppeteer generation error:', error);
    throw error;
  }
};

module.exports = { generatePrescriptionPDF };
