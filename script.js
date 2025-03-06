document.addEventListener('DOMContentLoaded', () => {
  const imageUpload = document.getElementById('imageUpload');
  const processImageButton = document.getElementById('processImage');
  const tipsTableBody = document.getElementById('tipsTable').querySelector('tbody');
  const totalHoursValue = document.getElementById('totalHoursValue');
  const totalWeeklyDollarsInput = document.getElementById('totalWeeklyDollars');
  const calculateTipsButton = document.getElementById('calculateTips');
  const loadingDiv = document.getElementById('loading');

  processImageButton.addEventListener('click', async () => {
    const imageFile = imageUpload.files[0];
    if (!imageFile) {
      alert('Please select an image.');
      return;
    }

    loadingDiv.style.display = 'block';
    tipsTableBody.innerHTML = '';
    totalHoursValue.textContent = '0';

    try {
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'eng',
        { logger: m => console.log(m) }
      );

      console.log('OCR Result:', text); // Log the raw OCR text

      const tableData = parseTableData(text);
      displayTable(tableData);
      updateTotalHours(tableData);
    } catch (error) {
      console.error('Error during OCR:', error);
      alert('Error processing image. Please try again.');
    } finally {
      loadingDiv.style.display = 'none';
    }
  });

  calculateTipsButton.addEventListener('click', () => {
    const totalWeeklyDollars = parseFloat(totalWeeklyDollarsInput.value);
    if (isNaN(totalWeeklyDollars) || totalWeeklyDollars <= 0) {
      alert('Please enter a valid total weekly dollar amount.');
      return;
    }

    calculateAndDisplayTips(totalWeeklyDollars);
  });

  function parseTableData(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const data = [];
    console.log('Lines:', lines);

    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(/\s{2,}|\t/);
      console.log('Values:', values);

      if (values.length >= 3) {
        const partnerName = values[0].trim();
        const partnerNumber = values[1].trim();
        const totalTippableHours = parseFloat(values[2].trim());

        if (!isNaN(totalTippableHours)) {
          data.push({
            'Partner Name': partnerName,
            'Partner Number': partnerNumber,
            'Total Tippable Hours': totalTippableHours
          });
        } else {
          console.warn('Invalid Total Tippable Hours:', values[2]);
        }
      } else {
        console.warn('Skipping line due to insufficient values:', lines[i]);
      }
    }

    return data;
  }

  function displayTable(data) {
    data.forEach(item => {
      const row = tipsTableBody.insertRow();
      const nameCell = row.insertCell();
      const numberCell = row.insertCell();
      const hoursCell = row.insertCell();
      const tipCell = row.insertCell();

      nameCell.textContent = item['Partner Name'];
      numberCell.textContent = item['Partner Number'];
      hoursCell.textContent = item['Total Tippable Hours'];
      tipCell.textContent = '0'; // Placeholder
    });
  }

  function updateTotalHours(data) {
    const total = data.reduce((sum, item) => sum + item['Total Tippable Hours'], 0);
    totalHoursValue.textContent = total.toFixed(2);
  }

  function calculateAndDisplayTips(totalWeeklyDollars) {
    const totalHours = parseFloat(totalHoursValue.textContent);
    const tipRate = totalWeeklyDollars / totalHours;
    const rows = tipsTableBody.querySelectorAll('tr');
    let totalTipsAssigned = 0;

    rows.forEach((row, index) => {
      const hours = parseFloat(row.cells[2].textContent);
      let tip = Math.round(hours * tipRate);
      totalTipsAssigned += tip;
      row.cells[3].textContent = tip;
    });

    // Adjust the last partner's tip to match the total
    const difference = totalWeeklyDollars - totalTipsAssigned;
    if (difference !== 0 && rows.length > 0) {
      const lastTip = parseInt(rows[rows.length - 1].cells[3].textContent);
      rows[rows.length - 1].cells[3].textContent = lastTip + difference;
    }
  }
});
