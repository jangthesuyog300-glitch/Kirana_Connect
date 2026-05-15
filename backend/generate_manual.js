const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Paths
const guidePath = path.join(__dirname, '..', 'COMPLETE_APP_GUIDE.md');
const outputPath = path.join(__dirname, '..', 'Kirana_Connect_Manual.pdf');

// Image paths from the Markdown (extracted manually for this script)
const images = [
  'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\17932138-cff3-4e51-bbcd-90f26a156917\\auth_otp_flow_1778067286284.png',
  'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\17932138-cff3-4e51-bbcd-90f26a156917\\customer_app_home_1778066758446.png',
  'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\17932138-cff3-4e51-bbcd-90f26a156917\\checkout_confirmation_1778067510395.png',
  'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\17932138-cff3-4e51-bbcd-90f26a156917\\store_admin_dashboard_1778066890467.png',
  'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\17932138-cff3-4e51-bbcd-90f26a156917\\admin_inventory_catalog_1778067525033.png',
  'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\17932138-cff3-4e51-bbcd-90f26a156917\\worker_order_view_1778066906247.png'
];

async function generatePDF() {
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Title
  doc.fontSize(26).fillColor('#2d3436').text('Kirana Connect', { align: 'center' });
  doc.fontSize(16).fillColor('#636e72').text('Complete Application Manual', { align: 'center' });
  doc.moveDown(2);

  const sections = [
    { title: '1. Authentication & Onboarding', imgIndex: 0, text: 'Secure, OTP-based authentication system for all users. Includes registration, login, and verification processes.' },
    { title: '2. Customer Discovery', imgIndex: 1, text: 'Hyperlocal store search with geospatial filtering and category-based product browsing.' },
    { title: '3. Checkout & Tracking', imgIndex: 2, text: 'Real-time order status updates from placement to delivery, including pickup OTP verification.' },
    { title: '4. Admin Dashboard', imgIndex: 3, text: 'Comprehensive store management with sales analytics and worker status monitoring.' },
    { title: '5. Inventory & Catalog', imgIndex: 4, text: 'Manage thousands of items with Master Catalog sync and custom product creation.' },
    { title: '6. Worker Fulfillment', imgIndex: 5, text: 'High-efficiency order preparation and preparation status management.' }
  ];

  for (const section of sections) {
    doc.addPage();
    doc.fontSize(20).fillColor('#0984e3').text(section.title);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#2d3436').text(section.text);
    doc.moveDown(1);
    
    if (fs.existsSync(images[section.imgIndex])) {
      doc.image(images[section.imgIndex], {
        fit: [500, 400],
        align: 'center',
        valign: 'center'
      });
    } else {
      doc.text('[Image Missing]', { align: 'center' });
    }
  }

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log('PDF generated successfully at: ' + outputPath);
      resolve();
    });
  });
}

generatePDF().catch(console.error);
