const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateInvoice(order, user) {

  const invoicePath = path.join(
    __dirname,
    `../invoices/invoice-${order._id}.pdf`
  );

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(invoicePath));

  doc.fontSize(22).text("LiveFit Invoice", { align: "center" });

  doc.moveDown();

  doc.fontSize(14).text(`Order ID: ${order._id}`);
  doc.text(`Customer: ${user.username}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown();

  doc.text("Items:");

  order.items.forEach((item) => {

    doc.text(
      `${item.mealId?.name || "Unknown Meal"} x ${item.quantity}`
    );
  
  });

  doc.moveDown();

  doc.fontSize(16).text(`Total: ₹${order.totalPrice}`);

  doc.end();

  return invoicePath;

}

module.exports = generateInvoice;