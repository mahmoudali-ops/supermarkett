import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { environment } from '../../environments/environments';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ZXingScannerModule],
    templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  scannerEnabled = true;
  product: any = null;
  newQuantity: number = 0;
  
  // استبدل الـ IP ده بالـ IP بتاعك (192.168.1.13) والـ Port بتاع الباك إند
  // تحديد الأنواع المشهورة في السوبر ماركت لتسريع المسح
  allowedFormats = [
    BarcodeFormat.EAN_13, 
    BarcodeFormat.EAN_8, 
    BarcodeFormat.CODE_128, 
    BarcodeFormat.UPC_A, 
    BarcodeFormat.UPC_E
  ];

  constructor(private http: HttpClient) {}

  // دالة تُستدعى عند نجاح المسح
  onCodeResult(code: string) {
    const scannedCode = code.trim();
    this.http.get(`${environment.BaseUrl}/${scannedCode}`).subscribe({
      next: (data: any) => {
        this.product = data;
        this.newQuantity = 0; // الحقل يبدأ بـ 0 أو فاضي للإضافة فقط
        this.scannerEnabled = false;
      },
      error: (err) => {
        alert('المنتج غير موجود!');
        this.resetScanner();
      }
    });
  }
  saveQuantity() {
    this.http.put(`${environment.BaseUrl}/update-quantity/${this.product.productCode}`, this.newQuantity)
      .subscribe({
        next: () => {
          alert('تم التحديث بنجاح ✅');
          this.resetScanner();
        },
        error: (err) => alert('حدث خطأ أثناء الحفظ')
      });
  }

  resetScanner() {
    this.product = null;
    this.scannerEnabled = true;
  }


  exportToExcel() {
    // العنوان بتاع الـ Export
    const exportUrl = `${environment.BaseUrl}/export`;
  
    this.http.get(exportUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // إنشاء لينك وهمي لتحميل الملف
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = 'inventory_report.xlsx'; // اسم الملف اللي هينزل
        a.click();
        URL.revokeObjectURL(objectUrl);
        alert('تم تحميل ملف الإكسيل بنجاح ✅');
      },
      error: (err) => {
        console.error('Export error:', err);
        alert('حدث خطأ أثناء تحميل الملف');
      }
    });
  }


  manualCode: string = ''; // متغير لحفظ الكود المدخل يدوياً

// دالة البحث اليدوي
searchManually() {
  if (!this.manualCode || this.manualCode.trim() === '') {
    alert('من فضلك أدخل كود المنتج أولاً');
    return;
  }
  
  const codeToSearch = this.manualCode.trim();
  console.log('Searching Manually for:', codeToSearch);
  
  // بننادي على نفس الدالة اللي السكانر بيستخدمها عشان نوحد المنطق
  this.onCodeResult(codeToSearch);
  
  // مسح الحقل بعد البحث
  this.manualCode = '';
}
}
