import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ServiceDetail } from '../models/service-detail.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceDetailService {
  private servicesCatalog: ServiceDetail[] = [
    {
      code: 'KB-TIMMACH',
      name: 'Khám Chuyên Khoa Tim Mạch Toàn Diện',
      subtitle: 'Tầm soát chuyên sâu bệnh lý van tim, mạch vành, huyết áp với hệ thống chuẩn FDA Hoa Kỳ',
      category: 'KHÁM BỆNH',
      price: 200000,
      duration: '20 - 30 phút',
      room: 'Phòng khám Nội 101',
      icon: 'heart-pulse',
      isPopular: true,
      shortDescription: 'Thăm khám, đo huyết áp, đánh giá nguy cơ xơ vữa, suy tim và bệnh mạch vành.',
      bannerImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format&fit=crop&q=80',
      overviewHtml: `
        <p><strong>Khám Chuyên Khoa Tim Mạch</strong> tại Smart Clinic là gói dịch vụ y tế chuẩn quốc tế giúp đánh giá toàn diện chức năng cơ tim, hệ thống van tim, huyết áp động mạch và nguy cơ biến cố tim mạch (nhồi máu cơ tim, đột quỵ).</p>
        <p>Quy trình thăm khám được dẫn dắt bởi các <em>Tiến sĩ, Thạc sĩ Tim mạch đầu ngành</em> với sự trợ giúp của hệ thống trang thiết bị chẩn đoán không xâm lấn thế hệ mới nhất, phát hiện kịp thời các tổn thương vi thể trước khi xuất hiện triệu chứng lâm sàng rõ rệt.</p>
      `,
      clinicalIndications: [
        'Đau thắt ngực, cảm giác đè nặng hoặc tức nghẹt vùng ngực trái lan ra vai/hàm.',
        'Hồi hộp, đánh trống ngực, nhịp tim không đều hoặc cảm giác hẫng nhịp.',
        'Khó thở khi gắng sức, leo cầu thang hoặc khi nằm đầu thấp vào ban đêm.',
        'Tiền sử gia đình có người mắc bệnh mạch vành sớm, tăng huyết áp hoặc đột quỵ.',
        'Người có bệnh lý nền đái tháo đường, rối loạn mỡ máu, thừa cân hoặc hút thuốc lá lâu năm.',
        'Khám tầm soát định kỳ cho người từ 35 tuổi trở lên nhằm bảo vệ sức khỏe hệ tuần hoàn.',
      ],
      contraindications: [
        'Không có chống chỉ định tuyệt đối cho việc khám lâm sàng.',
        'Trường hợp cấp cứu nhồi máu cơ tim có sốc hoặc ngừng tuần hoàn cần chuyển khoa cấp cứu hồi sức ngay.',
      ],
      equipment: [
        {
          name: 'Máy Siêu Âm Tim 4D Ma Trận GE Vivid E95',
          manufacturer: 'GE Healthcare (Hoa Kỳ)',
          origin: 'Hoa Kỳ - GE Healthcare',
          imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
          certifications: ['FDA (Hoa Kỳ)', 'CE Mark (Châu Âu)', 'ISO 13485'],
          tagline: 'Hệ thống siêu âm tim ma trận 4D định chuẩn quốc tế với công nghệ xử lý hình ảnh cSound™',
          description: 'Hệ thống GE Vivid E95 sử dụng chùm tia ma trận 4D độ phân giải siêu nét, cho phép dựng hình thể tích buồng tim và dòng máu chuyển động theo thời gian thực. Hệ thống hỗ trợ đo phân suất tống máu EF tự động bằng AI, đánh giá sức căng cơ tim (Strain Rate) phát hiện thiếu máu cục bộ trước khi có rối loạn co bóp.',
          techSpecs: [
            { label: 'Đầu dò ma trận', value: '4V-D Matrix 4D Single Crystal' },
            { label: 'Tốc độ khung hình', value: 'Lên đến 120 FPS thời gian thực' },
            { label: 'Công nghệ phân tích', value: 'AFI 2.0 (Automated Function Imaging)' },
            { label: 'Độ sâu khảo sát', value: 'Từ 2cm đến 30cm với độ tương phản cao' },
          ],
          patientBenefits: [
            'Hoàn toàn không đau, không xâm lấn, không sử dụng tia bức xạ.',
            'Bác sĩ và bệnh nhân quan sát trực tiếp chuyển động van tim và nhịp đập 4D trên màn hình OLED.',
            'Phát hiện sớm suy tim giai đoạn đầu và tổn thương mạch vành tiềm ẩn.',
          ],
        },
        {
          name: 'Máy Holter Điện Tim & Huyết Áp 24h Schiller Medilog AR12 Plus',
          manufacturer: 'Schiller AG (Thụy Sĩ)',
          origin: 'Thụy Sĩ',
          imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
          certifications: ['CE Mark', 'ISO 9001', 'Tiêu chuẩn AHA Hoa Kỳ'],
          tagline: 'Ghi liên tục điện tâm đồ và huyết áp suốt 24 - 48 giờ không gián đoạn',
          description: 'Thiết bị di động siêu nhỏ gọn chỉ nặng 70g, gắn nhẹ nhàng trên cơ thể bệnh nhân. Máy liên tục ghi lại mọi biến thiên nhịp tim và áp lực mạch trong cả lúc làm việc, vận động và giấc ngủ đêm, bắt trọn các cơn rung nhĩ kịch phát hoặc thiếu máu cơ tim thầm lặng.',
          techSpecs: [
            { label: 'Kênh ghi tín hiệu', value: '3/12 kênh điện tim phân giải cao 24-bit' },
            { label: 'Thời gian pin', value: 'Hoạt động liên tục 80 giờ' },
            { label: 'Thuật toán phát hiện', value: 'EchoView™ & Medilog DARWIN AI' },
            { label: 'Khối lượng thiết bị', value: '74g (siêu nhẹ, chống nước nhẹ)' },
          ],
          patientBenefits: [
            'Bệnh nhân hoàn toàn tự do sinh hoạt, làm việc và ngủ nghỉ bình thường.',
            'Bắt trọn 100% cơn loạn nhịp chớp nhoáng mà điện tim thông thường 10 giây dễ bỏ sót.',
          ],
        },
        {
          name: 'Trạm Đa Thông Số Sinh Hiệu Welch Allyn Connex ProBP 3400',
          manufacturer: 'Welch Allyn - Hillrom (Hoa Kỳ)',
          origin: 'Hoa Kỳ',
          imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&auto=format&fit=crop&q=80',
          certifications: ['FDA (Hoa Kỳ)', 'BHS A/A Grade (Anh Quốc)'],
          tagline: 'Đo huyết áp công nghệ SureBP™ chuẩn xác chỉ trong 15 giây',
          description: 'Được Hiệp hội Tăng huyết áp Anh Quốc xếp hạng A/A cao nhất về độ chuẩn xác. Công nghệ SureBP cho phép đo ngay trong quá trình bơm hơi vòng bít, giảm tối đa áp lực siết tay và loại bỏ hiện tượng tăng huyết áp "áo choàng trắng".',
          techSpecs: [
            { label: 'Thời gian đo', value: '15 giây (nhanh gấp 3 lần máy thông thường)' },
            { label: 'Độ sai số', value: '< ±3 mmHg (chuẩn lâm sàng)' },
            { label: 'Kết nối EMR', value: 'Tự động đồng bộ số liệu vào bệnh án điện tử' },
          ],
          patientBenefits: [
            'Đo êm ái, không bị đau tức bắp tay.',
            'Cho kết quả trung thực nhất về huyết áp thực của cơ thể.',
          ],
        },
      ],
      procedureSteps: [
        {
          stepNumber: 1,
          title: 'Tiếp đón & Kiểm tra sinh hiệu thông minh',
          duration: '5 phút',
          description: 'Điều dưỡng tiếp đón, kiểm tra huyết áp 2 tay với trạm Welch Allyn, đo chỉ số bão hòa oxy SpO2 và cân nặng chiều cao tự động.',
          tips: 'Nghỉ ngơi thả lỏng tại phòng chờ 5 phút trước khi đo để huyết áp ổn định.',
        },
        {
          stepNumber: 2,
          title: 'Khám lâm sàng cùng Bác sĩ Chuyên gia',
          duration: '10 - 15 phút',
          description: 'Tiến sĩ/Thạc sĩ Tim mạch trực tiếp hỏi tiền sử, nghe tim phổi bằng ống nghe chuyên dụng 3M Littmann, khám tìm dấu hiệu ứ trệ tuần hoàn và đánh giá nguy cơ xơ vữa.',
          tips: 'Nêu rõ các triệu chứng bạn hay gặp và các thuốc tim mạch đang dùng.',
        },
        {
          stepNumber: 3,
          title: 'Khảo sát Cận lâm sàng chuyên sâu',
          duration: '10 - 15 phút',
          description: 'Thực hiện đo điện tâm đồ 12 chuyển đạo kỹ thuật số và siêu âm tim 4D GE Vivid E95 ngay tại phòng chuyên biệt nếu có chỉ định.',
          tips: 'Cởi bỏ đồ trang sức kim loại vùng ngực và nằm yên thả lỏng trên giường khám.',
        },
        {
          stepNumber: 4,
          title: 'Tư vấn kết quả, phác đồ điều trị & Xuất bệnh án số',
          duration: '5 - 10 phút',
          description: 'Bác sĩ phân tích kết quả siêu âm và điện tim, chẩn đoán nguyên nhân, tư vấn phác đồ dùng thuốc cá nhân hóa và chế độ sinh hoạt phòng ngừa đột quỵ.',
        },
      ],
      preparationInstructions: [
        {
          title: 'Hồ sơ y tế & Đơn thuốc cũ',
          icon: 'clipboard',
          type: 'REQUIRED',
          details: 'Mang theo tất cả kết quả khám, phim X-quang, điện tim cũ và các vỉ thuốc/đơn thuốc tim mạch bạn đang uống hàng ngày.',
        },
        {
          title: 'Không dùng chất kích thích',
          icon: 'alert-triangle',
          type: 'REQUIRED',
          details: 'Tránh uống cà phê, trà đặc, nước tăng lực hoặc hút thuốc lá ít nhất 4 tiếng trước khi khám vì sẽ làm nhịp tim đập nhanh giả tạo.',
        },
        {
          title: 'Trang phục thuận tiện',
          icon: 'check',
          type: 'RECOMMENDED',
          details: 'Mặc áo cài cúc phía trước hoặc áo rộng rãi, thoáng mát để thuận tiện bộc lộ vùng ngực khi đo điện tim và siêu âm tim.',
        },
        {
          title: 'Nhịn ăn (Nếu có làm thêm xét nghiệm máu)',
          icon: 'clock',
          type: 'NOTE',
          details: 'Nếu bạn có dự định làm kèm xét nghiệm mỡ máu (Lipid panel) hoặc đường huyết, nên nhịn ăn sáng trước khi đến khám.',
        },
      ],
      resultsTurnaroundTime: 'Có ngay sau khi kết thúc buổi khám (Hình ảnh & Kết luận đồng bộ trên Cổng Bệnh Nhân)',
      resultsFormat: [
        'Bản in kết quả khám lâm sàng & kết luận phân loại tim mạch có chữ ký bác sĩ',
        'Hình ảnh siêu âm tim màu 4D chất lượng cao & kết quả đo điện tim 12 cần',
        'Đơn thuốc điện tử chuẩn hóa tích hợp trên ứng dụng bệnh nhân Smart Clinic',
      ],
      assignedDoctors: [
        {
          id: 'doc-01',
          name: 'TS.BS Trần Minh Hoàng',
          title: 'Tiến sĩ Y khoa • Trưởng khoa Tim Mạch',
          specialty: 'Nội Tim Mạch & Can Thiệp Mạch Vành',
          experience: '22 năm kinh nghiệm',
          rating: 4.98,
          availableDays: 'Thứ 2 – Thứ 7 (Ca Sáng & Chiều)',
        },
      ],
      faqs: [
        {
          question: 'Khám tim mạch tại phòng khám có mất nhiều thời gian chờ đợi không?',
          answer: 'Tại Smart Clinic, quy trình khám được quản lý bằng số thứ tự số hóa thông minh. Bệnh nhân đặt lịch trước sẽ được ưu tiên tiếp nhận đúng khung giờ đã hẹn, tổng thời gian thăm khám chỉ mất khoảng 30 - 45 phút.',
        },
        {
          question: 'Siêu âm tim và đo điện tim có gây đau hay nguy hiểm gì không?',
          answer: 'Hoàn toàn không đau và tuyệt đối an toàn. Sóng siêu âm và điện tâm đồ là phương pháp chẩn đoán không xâm lấn, không có tia bức xạ, hoàn toàn vô hại với cả người cao tuổi và phụ nữ mang thai.',
        },
        {
          question: 'Nếu cần can thiệp ngoại khoa hoặc nhập viện thì phòng khám hỗ trợ thế nào?',
          answer: 'Smart Clinic liên kết trực tiếp với các Trung tâm Tim mạch hàng đầu (Viện Tim TP.HCM, Chợ Rẫy, Bạch Mai). Bác sĩ sẽ trực tiếp viết giấy chuyển tuyến ưu tiên và bàn giao hồ sơ số hóa nhanh chóng.',
        },
      ],
      qualityCommitments: [
        {
          title: 'Hệ thống thiết bị chuẩn FDA Hoa Kỳ',
          desc: '100% máy siêu âm tim, điện tim và đo sinh hiệu nhập khẩu chính hãng từ Mỹ và Nhật Bản.',
          icon: 'shield-check',
        },
        {
          title: 'Bác sĩ chuyên gia đầu ngành',
          desc: 'Trực tiếp thăm khám và tư vấn bởi các Tiến sĩ, Bác sĩ CKI công tác tại bệnh viện tuyến cuối.',
          icon: 'stethoscope',
        },
        {
          title: 'Hồ sơ bệnh án số hóa trọn đời',
          desc: 'Dễ dàng tra cứu kết quả, theo dõi biến thiên huyết áp và lịch sử toa thuốc trên cổng bệnh nhân.',
          icon: 'file-text',
        },
      ],
    },
    {
      code: 'KB-NOITQ',
      name: 'Khám Nội Tổng Quát Toàn Diện',
      subtitle: 'Tầm soát sức khỏe tổng quan, phát hiện sớm bệnh mãn tính đái tháo đường, gan, thận, rối loạn mỡ máu',
      category: 'KHÁM BỆNH',
      price: 150000,
      duration: '15 - 20 phút',
      room: 'Phòng khám Nội 102',
      icon: 'stethoscope',
      shortDescription: 'Tầm soát tổng quan sức khỏe, phát hiện sớm các bệnh lý mãn tính đái tháo đường, gan, thận.',
      bannerImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&auto=format&fit=crop&q=80',
      overviewHtml: `
        <p><strong>Khám Nội Tổng Quát Toàn Diện</strong> là bước thăm khám nền tảng giúp đánh giá trạng thái hoạt động của toàn bộ các hệ cơ quan: tuần hoàn, hô hấp, tiêu hóa, tiết niệu, nội tiết và chuyển hóa.</p>
        <p>Phương pháp tiếp cận y học gia đình và y học chứng cứ giúp định hướng chính xác các xét nghiệm cần thiết, tránh lạm dụng chỉ định không đáng có và phát hiện sớm các "kẻ giết người thầm lặng" như tăng huyết áp ẩn giấu hay tiền đái tháo đường.</p>
      `,
      clinicalIndications: [
        'Mệt mỏi kéo dài không rõ nguyên nhân, suy nhược cơ thể, sút cân hoặc tăng cân đột ngột.',
        'Thường xuyên đau đầu, hoa mắt, chóng mặt khi đứng dậy, mất ngủ kinh niên.',
        'Đầy bụng khó tiêu, chán ăn, ợ hơi, rối loạn tiêu hóa tái diễn nhiều lần.',
        'Khám sức khỏe định kỳ hàng năm cho nhân viên văn phòng, người lao động và người cao tuổi.',
        'Theo dõi và chỉnh liều thuốc cho bệnh nhân đái tháo đường, gout, tăng huyết áp.',
      ],
      equipment: [
        {
          name: 'Trạm Kiểm Tra Sinh Hiệu Welch Allyn Connex Spot Monitor',
          manufacturer: 'Hillrom - Welch Allyn (Hoa Kỳ)',
          origin: 'Hoa Kỳ',
          imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&auto=format&fit=crop&q=80',
          certifications: ['FDA (Hoa Kỳ)', 'CE Mark', 'ISO 13485'],
          tagline: 'Thu thập trọn bộ 5 chỉ số sinh tồn chỉ trong một lần chạm màn hình',
          description: 'Tự động đo nhiệt độ hồng ngoại tai Braun ThermoScan PRO, huyết áp SureBP, đo độ bão hòa oxy máu SpO2 Masimo và tính toán chỉ số cảnh báo sớm MEWS (Modified Early Warning Score).',
          techSpecs: [
            { label: 'Chỉ số đo', value: 'Huyết áp, Mạch, SpO2, Nhiệt độ, BMI' },
            { label: 'Thời gian đo nhiệt độ', value: '3 giây bằng sóng hồng ngoại tai' },
            { label: 'Độ chuẩn xác huyết áp', value: 'Tiêu chuẩn AAMI / BHS' },
          ],
          patientBenefits: [
            'Nhanh chóng, êm ái, bệnh nhân không phải chờ đợi từng khâu riêng lẻ.',
            'Cảnh báo sớm nguy cơ sốt, tụt oxy máu hoặc rối loạn huyết động.',
          ],
        },
        {
          name: 'Bộ Khám Mắt - Tai Mũi Họng Sợi Quang Heine Mini 3000',
          manufacturer: 'Heine Optotechnik (CHLB Đức)',
          origin: 'CHLB Đức',
          imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
          certifications: ['TUV Rheinland (Đức)', 'CE Mark'],
          tagline: 'Hệ thống quang học cao cấp của Đức tái hiện hình ảnh tổn thương chân thực',
          description: 'Sử dụng ánh sáng sợi quang Xenon Halogen cường độ cao không gây chói, cho phép bác sĩ quan sát rõ nét màng nhĩ, hốc mũi, vòm họng và cấu trúc võng mạc vi mạch.',
          techSpecs: [
            { label: 'Độ phóng đại', value: '3X với thấu kính chống trầy xước đa lớp' },
            { label: 'Nguồn sáng', value: 'Sợi quang học Xenon Halogen XHL cao cấp' },
            { label: 'Công nghệ bảo vệ mắt', value: 'Chống phản xạ ánh sáng giác mạc' },
          ],
          patientBenefits: [
            'Bác sĩ kiểm tra nhẹ nhàng, không gây đau buốt tai họng.',
            'Phát hiện sớm viêm họng mạn, polyp mũi hay xuất huyết vi mạch võng mạc.',
          ],
        },
      ],
      procedureSteps: [
        {
          stepNumber: 1,
          title: 'Tiếp nhận & Đo chỉ số sinh tồn tự động',
          duration: '5 phút',
          description: 'Đo chiều cao, cân nặng, tính chỉ số khối cơ thể BMI, đo huyết áp và nhịp tim.',
        },
        {
          stepNumber: 2,
          title: 'Khám lâm sàng đa hệ cơ quan',
          duration: '10 phút',
          description: 'Bác sĩ kiểm tra tai mũi họng, nghe tim phổi, sờ nắn ổ bụng tìm điểm đau gan mật tụy, kiểm tra phản xạ thần kinh.',
        },
        {
          stepNumber: 3,
          title: 'Chỉ định cận lâm sàng cần thiết (nếu có)',
          duration: '5 phút',
          description: 'Dựa trên triệu chứng, bác sĩ tư vấn xét nghiệm máu, siêu âm hoặc chụp X-quang phù hợp nhất, tránh lãng phí chi phí.',
        },
        {
          stepNumber: 4,
          title: 'Kết luận sức khỏe & Hướng dẫn lối sống',
          duration: '5 phút',
          description: 'Tổng kết tình trạng sức khỏe, kê đơn thuốc điện tử và hướng dẫn thực đơn dinh dưỡng, bài tập nâng cao thể trạng.',
        },
      ],
      preparationInstructions: [
        {
          title: 'Nhịn ăn sáng nếu làm xét nghiệm',
          icon: 'clock',
          type: 'RECOMMENDED',
          details: 'Nên nhịn ăn từ 6 - 8 tiếng (có thể uống nước lọc) nếu có ý định xét nghiệm máu hoặc siêu âm bụng cùng buổi khám.',
        },
        {
          title: 'Ghi lại các triệu chứng bất thường',
          icon: 'clipboard',
          type: 'RECOMMENDED',
          details: 'Ghi chú các triệu chứng hay gặp trong tháng qua, thời điểm xuất hiện và mức độ khó chịu để trao đổi cùng bác sĩ.',
        },
      ],
      resultsTurnaroundTime: 'Có ngay sau buổi khám (kèm đơn thuốc điện tử & lời dặn chuyên môn)',
      resultsFormat: [
        'Bản tóm tắt bệnh án nội khoa tổng quát',
        'Lời dặn dinh dưỡng và chế độ rèn luyện thể chất cá nhân hóa',
        'Kê đơn thuốc điện tử chuẩn hóa theo Bộ Y tế',
      ],
      assignedDoctors: [
        {
          id: 'doc-02',
          name: 'ThS.BS Nguyễn Thị Mai Lan',
          title: 'Thạc sĩ Bác sĩ Nội trú',
          specialty: 'Khoa Nội Tổng Quát & Chuyển Hóa',
          experience: '14 năm kinh nghiệm',
          rating: 4.95,
          availableDays: 'Thứ 2 – Chủ Nhật (Ca Sáng)',
        },
      ],
      faqs: [
        {
          question: 'Tôi còn trẻ, không thấy đau ốm thì có cần khám tổng quát không?',
          answer: 'Rất nhiều bệnh lý như tăng huyết áp, gan nhiễm mỡ, mỡ máu cao hay tiền đái tháo đường phát triển âm thầm trong nhiều năm không gây triệu chứng. Khám tổng quát định kỳ là cách tốt nhất để phòng ngừa biến chứng nặng về sau.',
        },
      ],
      qualityCommitments: [
        {
          title: 'Khám kỹ càng, tư vấn tận tâm',
          desc: 'Thời lượng khám tối thiểu 15-20 phút, bác sĩ giải thích tỉ mỉ từng thắc mắc của bạn.',
          icon: 'stethoscope',
        },
        {
          title: 'Không lạm dụng chỉ định xét nghiệm',
          desc: 'Chỉ chỉ định các kỹ thuật cận lâm sàng thật sự cần thiết theo phác đồ y khoa chuẩn mực.',
          icon: 'shield-check',
        },
      ],
    },
    {
      code: 'ECG-12C',
      name: 'Điện Tâm Đồ 12 Chuyển Đạo (ECG)',
      subtitle: 'Ghi nhận chính xác xung điện sinh học của tim, phát hiện rối loạn nhịp, thiếu máu cơ tim và dày buồng tim sớm',
      category: 'CẬN LÂM SÀNG',
      price: 100000,
      duration: '10 phút',
      room: 'Phòng Đo Điện Tim (ECG)',
      icon: 'activity',
      shortDescription: 'Phát hiện rối loạn nhịp tim, thiếu máu cơ tim và biến chứng tim mạch sớm.',
      bannerImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=80',
      overviewHtml: `
        <p><strong>Điện tâm đồ (ECG - Electrocardiogram) 12 chuyển đạo</strong> là xét nghiệm cận lâm sàng then chốt giúp ghi lại đồ thị biến thiên điện học do nút xoang và các tế bào cơ tim phát ra trong mỗi chu kỳ co bóp.</p>
        <p>Bằng cách gắn 12 điện cực chuẩn quanh tim và chi, bác sĩ có thể nhìn toàn diện trái tim từ 12 góc độ không gian khác nhau, giúp phát hiện ngay lập tức tình trạng thiếu máu cơ tim cấp, rung nhĩ, ngoại tâm thu, bloc dẫn truyền hay phì đại thất trái do tăng huyết áp lâu ngày.</p>
      `,
      clinicalIndications: [
        'Cảm giác hồi hộp, tim đập nhanh dồn dập hoặc hụt nhịp (ngoại tâm thu).',
        'Đau nhói vùng trước tim hoặc tức nặng lồng ngực lan lên cổ, vai hoặc cánh tay.',
        'Chóng mặt bất ngờ, choáng váng hoặc đã từng bị ngất xỉu đột ngột.',
        'Bệnh nhân chuẩn bị phẫu thuật hoặc thủ thuật cần đánh giá tiền mê.',
        'Kiểm tra định kỳ cho người mắc bệnh tăng huyết áp, đái tháo đường hoặc suy thận.',
      ],
      equipment: [
        {
          name: 'Máy Điện Tim Kỹ Thuật Số 12 Cần Nihon Kohden Cardiofax M ECG-2350',
          manufacturer: 'Nihon Kohden Corporation (Nhật Bản)',
          origin: 'Nhật Bản',
          imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
          certifications: ['Tiêu chuẩn IEC 60601-2-25 Nhật Bản', 'FDA (Hoa Kỳ)', 'CE Mark'],
          tagline: 'Thuật toán phân tích ECAPS12C độc quyền với độ nhạy cao vượt trội',
          description: 'Dòng máy điện tim cao cấp của hãng Nihon Kohden nổi tiếng thế giới. Máy phân tích đồng thời 12 chuyển đạo với tần số lấy mẫu 8.000 Hz, tự động loại bỏ nhiễu điện cơ (EMG) và nhiễu xoay chiều (AC), đưa ra kết quả phân tích chuẩn xác theo khuyến cáo AHA/ACC.',
          techSpecs: [
            { label: 'Tần số lấy mẫu', value: '8.000 Hz (độ phân giải sóng cực cao)' },
            { label: 'Thuật toán chẩn đoán', value: 'ECAPS12C tự động nhận diện > 200 dạng sóng bệnh lý' },
            { label: 'Màn hình hiển thị', value: 'LCD màu 7 inch hiển thị sắc nét 12 đạo trình cùng lúc' },
            { label: 'Kết nối', value: 'Xuất file DICOM / PDF trực tiếp vào EMR' },
          ],
          patientBenefits: [
            'Chỉ mất 10 giây ghi sóng, kết quả hiển thị ngay tức thì.',
            'Bộ lọc nhiễu thông minh không cần cạo lông ngực hoặc gây khó chịu cho da.',
            'Cảnh báo tức thời nếu phát hiện dấu hiệu nhồi máu cơ tim cấp tính (STEMI).',
          ],
        },
      ],
      procedureSteps: [
        {
          stepNumber: 1,
          title: 'Chuẩn bị bệnh nhân & Vị trí nằm',
          duration: '3 phút',
          description: 'Kỹ thuật viên hướng dẫn bệnh nhân nằm ngửa thả lỏng trên giường điện tim, tháo trang sức kim loại ở cổ tay và mắt cá chân.',
        },
        {
          stepNumber: 2,
          title: 'Gắn các đầu điện cực hút',
          duration: '3 phút',
          description: 'Thoa gel tiếp xúc và gắn 6 điện cực trước ngực (V1 - V6) cùng 4 điện cực kẹp chi (tay phải, tay trái, chân phải, chân trái).',
          tips: 'Gel mát nhẹ, các đầu hút chân không bằng silicon mềm mại không gây đau.',
        },
        {
          stepNumber: 3,
          title: 'Ghi sóng điện tim 12 đạo trình',
          duration: '2 phút',
          description: 'Máy tự động đo và ghi nhận 12 chuyển đạo trong khoảng 10-15 giây. Bệnh nhân thở đều, không cử động hoặc nói chuyện trong lúc ghi sóng.',
        },
        {
          stepNumber: 4,
          title: 'Tháo điện cực & Trả kết quả số',
          duration: '2 phút',
          description: 'Lau sạch gel trên da, in kết quả sóng điện tim vi tính và chuyển dữ liệu trực tiếp đến bác sĩ tim mạch để đọc kết luận.',
        },
      ],
      preparationInstructions: [
        {
          title: 'Không cần nhịn ăn uống',
          icon: 'check',
          type: 'NOTE',
          details: 'Bạn có thể ăn uống bình thường trước khi đo điện tim.',
        },
        {
          title: 'Thả lỏng tinh thần',
          icon: 'heart-pulse',
          type: 'REQUIRED',
          details: 'Nên ngồi nghỉ tại phòng chờ 10 phút nếu bạn vừa đi bộ hoặc leo cầu thang đến.',
        },
        {
          title: 'Tránh chất kích thích',
          icon: 'alert-triangle',
          type: 'REQUIRED',
          details: 'Không uống cà phê, trà đậm hoặc rượu bia trước khi đo vì có thể làm nhịp tim đập nhanh bất thường.',
        },
      ],
      resultsTurnaroundTime: 'Trả kết quả ngay sau 5 phút đo',
      resultsFormat: [
        'Bản in đồ thị điện tim 12 cần chuẩn độ phân giải cao',
        'Bản phân tích các chỉ số nhịp tim, trục điện tim, khoảng PR, QRS, QTc',
        'Kết luận và ký duyệt bởi Bác sĩ Chuyên khoa Tim mạch',
      ],
      assignedDoctors: [
        {
          id: 'doc-01',
          name: 'TS.BS Trần Minh Hoàng',
          title: 'Tiến sĩ Y khoa • Trưởng khoa Tim Mạch',
          specialty: 'Điện Sinh Học & Bệnh Tim Cấu Trúc',
          experience: '22 năm kinh nghiệm',
          rating: 4.98,
          availableDays: 'Thứ 2 – Thứ 7',
        },
      ],
      faqs: [
        {
          question: 'Đo điện tim có bị giật điện vào người không?',
          answer: 'Hoàn toàn KHÔNG! Máy điện tim chỉ thu nhận sóng điện sinh học tự nhiên phát ra từ trái tim bạn thông qua các cảm biến nhạy cảm, tuyệt đối không truyền bất kỳ dòng điện nào vào cơ thể.',
        },
      ],
      qualityCommitments: [
        {
          title: 'Thuật toán Nhật Bản chuẩn xác',
          desc: 'Được trang bị thuật toán ECAPS12C chuẩn AHA của hãng Nihon Kohden nổi tiếng.',
          icon: 'shield-check',
        },
        {
          title: 'Bác sĩ chuyên khoa Tim mạch đọc kết quả',
          desc: '100% bản ghi điện tim đều được Tiến sĩ, Bác sĩ Tim mạch trực tiếp kiểm duyệt và kết luận.',
          icon: 'stethoscope',
        },
      ],
    },
    {
      code: 'US-BUNGTQ',
      name: 'Siêu Âm Ổ Bụng Tổng Quát Doppler Màu Chuyên Sâu',
      subtitle: 'Khảo sát hình ảnh siêu nét toàn bộ gan, mật, thận, tụy, lách, bàng quang và mạch máu ổ bụng với công nghệ Doppler năng lượng cao',
      category: 'CHẨN ĐOÁN HÌNH ẢNH',
      price: 250000,
      duration: '15 - 20 phút',
      room: 'Phòng Siêu Âm 01',
      icon: 'xray',
      isPopular: true,
      shortDescription: 'Khảo sát gan mật, thận, tụy, lách, tiền liệt tuyến và hệ tiêu hóa rõ nét.',
      bannerImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      overviewHtml: `
        <p><strong>Siêu Âm Ổ Bụng Tổng Quát Doppler Màu</strong> là phương pháp chẩn đoán hình ảnh không xâm lấn hàng đầu, sử dụng sóng siêu âm tần số cao để tái tạo hình ảnh cấu trúc và giải phẫu các cơ quan nội tạng nằm trong ổ bụng.</p>
        <p>Tại Smart Clinic, hệ thống máy siêu âm hiện đại bậc nhất tích hợp <em>công nghệ Doppler màu HD-Flow và đầu dò đơn tinh thể XDclear</em>, cho phép bác sĩ quan sát rõ từng mạch máu nhỏ, phân biệt khối u lành tính hay ác tính, phát hiện sỏi mật, sỏi thận, gan nhiễm mỡ hay nang tụy kích thước chỉ từ 1 - 2mm.</p>
      `,
      clinicalIndications: [
        'Đau bụng âm ỉ hoặc đau quặn dữ dội vùng thượng vị, hạ sườn phải, quanh rốn hoặc vùng bụng dưới.',
        'Đầy hơi, chướng bụng khó tiêu, chán ăn, vàng da, vàng mắt hoặc nước tiểu sẫm màu.',
        'Tiểu buốt, tiểu rắt, tiểu ra máu hoặc đau mỏi dữ dội vùng thắt lưng (nghi sỏi thận, niệu quản).',
        'Tầm soát định kỳ phát hiện sớm u gan, xơ gan, nang thận, phì đại tiền liệt tuyến ở nam giới hoặc u xơ tử cung ở nữ giới.',
        'Kiểm tra sau chấn thương vùng bụng để loại trừ dập vỡ tạng đặc hoặc tràn máu ổ bụng.',
      ],
      equipment: [
        {
          name: 'Hệ Thống Siêu Âm Màu Chuyên Sâu GE Logiq P9 & Voluson E10',
          manufacturer: 'GE Healthcare (Hoa Kỳ)',
          origin: 'Hoa Kỳ - GE Healthcare',
          imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
          certifications: ['FDA (Hoa Kỳ)', 'CE Mark (Châu Âu)', 'ISO 13485'],
          tagline: 'Đỉnh cao hình ảnh siêu âm với công nghệ đầu dò XDclear™ và xử lý đa chùm tia',
          description: 'Hệ thống Logiq P9 thế hệ mới của hãng GE Healthcare được tích hợp bộ vi xử lý đồ họa GPU siêu tốc, công nghệ giảm nhiễu hạt SRI-HD và xử lý dòng chảy Doppler nhạy bén. Nhờ vậy, hình ảnh nhu mô gan, thận và tụy hiện lên sắc nét, tách biệt rõ ranh giới giữa mô lành và tổn thương vi mô.',
          techSpecs: [
            { label: 'Công nghệ đầu dò', value: 'XDclear Single Crystal Matrix Probe' },
            { label: 'Màn hình quan sát', value: 'Màn hình OLED y khoa 23.8 inch Full HD góc rộng' },
            { label: 'Chế độ Doppler', value: 'Color Doppler, Power Doppler, HD-Flow, B-Flow' },
            { label: 'Đo độ đàn hồi mô', value: 'Elastography đánh giá xơ hóa gan tự động' },
          ],
          patientBenefits: [
            'Hoàn toàn không có tia phóng xạ, tuyệt đối an toàn cho mọi lứa tuổi.',
            'Đầu dò êm ái kết hợp gel siêu âm làm ấm vô trùng, không gây cảm giác lạnh buốt khi tiếp xúc da.',
            'Bác sĩ chỉ ra trực tiếp hình ảnh nội tạng trên màn hình phụ để bệnh nhân dễ dàng theo dõi.',
          ],
        },
      ],
      procedureSteps: [
        {
          stepNumber: 1,
          title: 'Chuẩn bị tư thế & Bộc lộ vùng bụng',
          duration: '3 phút',
          description: 'Bệnh nhân nằm ngửa trên giường đệm y khoa êm ái, kéo áo cao ngang ngực và hạ lưng quần xuống ngang xương mu.',
        },
        {
          stepNumber: 2,
          title: 'Thoa gel ấm & Khảo sát tạng đặc ổ bụng trên',
          duration: '7 phút',
          description: 'Bác sĩ thoa lớp gel chuyên dụng làm ấm và di chuyển đầu dò khảo sát gan, túi mật, đường mật, tụy và lách. Có thể hướng dẫn bệnh nhân hít sâu nín thở vài giây.',
          tips: 'Hít sâu nín thở giúp cơ hoành hạ xuống, đẩy gan và túi mật ra khỏi bờ sườn để bác sĩ quan sát rõ nhất.',
        },
        {
          stepNumber: 3,
          title: 'Khảo sát hệ tiết niệu & Vùng bụng dưới',
          duration: '5 phút',
          description: 'Khảo sát 2 quả thận, tuyến thượng thận, bàng quang và tiền liệt tuyến (ở nam) hoặc tử cung buồng trứng (ở nữ).',
        },
        {
          stepNumber: 4,
          title: 'Lau gel, in ảnh màu & Bác sĩ giải thích kết quả',
          duration: '3 phút',
          description: 'Điều dưỡng cung cấp khăn mềm lau sạch gel, in phiếu kết quả kèm ảnh chụp siêu âm độ nét cao và bác sĩ giải thích cặn kẽ tình trạng.',
        },
      ],
      preparationInstructions: [
        {
          title: 'Nhịn ăn ít nhất 6 - 8 tiếng',
          icon: 'clock',
          type: 'REQUIRED',
          details: 'Giúp túi mật căng to đầy dịch mật (không bị xẹp do co bóp tiêu hóa) và đường ruột không bị sinh hơi, giúp khảo sát nhu mô gan, mật và tụy chính xác nhất.',
        },
        {
          title: 'Uống nước & Nhịn tiểu trước 30-45 phút',
          icon: 'alert-triangle',
          type: 'REQUIRED',
          details: 'Uống khoảng 2 - 3 cốc nước lọc trước giờ siêu âm và nhịn tiểu để bàng quang căng đầy, tạo "cửa sổ âm học" khảo sát bàng quang, tiền liệt tuyến và tử cung.',
        },
        {
          title: 'Mặc trang phục 2 mảnh thoải mái',
          icon: 'check',
          type: 'RECOMMENDED',
          details: 'Nên mặc áo rời và quần thun co giãn rộng rãi để dễ bộc lộ vùng bụng, tránh mặc váy liền thân.',
        },
      ],
      resultsTurnaroundTime: 'Có ngay sau 5 - 10 phút sau khi kết thúc siêu âm',
      resultsFormat: [
        'Phiếu kết quả siêu âm chi tiết từng cơ quan ổ bụng kèm mô tả kích thước và cấu trúc âm',
        'Ảnh siêu âm màu in trên giấy ảnh y khoa nhiệt chuyên dụng bền màu',
        'Lưu trữ file ảnh số hóa trên hồ sơ bệnh án điện tử PACS',
      ],
      assignedDoctors: [
        {
          id: 'doc-03',
          name: 'BS.CKI Lê Quốc Hưng',
          title: 'Bác sĩ Chuyên khoa I',
          specialty: 'Chẩn Đoán Hình Ảnh & Bệnh Lý Tiêu Hóa Gan Mật',
          experience: '16 năm kinh nghiệm',
          rating: 4.96,
          availableDays: 'Thứ 2 – Thứ 6 (Ca Sáng)',
        },
      ],
      faqs: [
        {
          question: 'Tại sao siêu âm bụng lại bắt buộc phải nhịn ăn?',
          answer: 'Khi bạn ăn uống, thức ăn kích thích túi mật co bóp tống mật vào ruột non, khiến túi mật xẹp lại rất khó quan sát sỏi hoặc polyp. Ngoài ra, quá trình tiêu hóa sinh ra nhiều bọt khí cản trở hoàn toàn sóng siêu âm, che khuất tụy và các mạch máu lớn sau phúc mạc.',
        },
      ],
      qualityCommitments: [
        {
          title: 'Độ sắc nét vượt trội',
          desc: 'Trang bị máy GE Healthcare Mỹ thế hệ mới giúp phát hiện tổn thương siêu nhỏ từ 1 - 2mm.',
          icon: 'eye',
        },
        {
          title: 'Bác sĩ chẩn đoán hình ảnh giàu kinh nghiệm',
          desc: 'Trực tiếp thực hiện bởi các bác sĩ Chuyên khoa I với hơn 15 năm kinh nghiệm siêu âm bụng.',
          icon: 'stethoscope',
        },
      ],
    },
    {
      code: 'XR-NGUC',
      name: 'X-Quang Ngực Thẳng Kỹ Thuật Số (DR)',
      subtitle: 'Chụp hình ảnh lồng ngực, nhu mô phổi và tim siêu nhanh, giảm 50% liều tia X với công nghệ cảm biến FPD Nhật Bản',
      category: 'CHẨN ĐOÁN HÌNH ẢNH',
      price: 150000,
      duration: '10 phút',
      room: 'Phòng X-Quang Kỹ Thuật Số',
      icon: 'xray',
      shortDescription: 'Hình ảnh phổi, bóng tim và lồng ngực kỹ thuật số độ phân giải cao, liều tia thấp.',
      bannerImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      overviewHtml: `
        <p><strong>X-Quang Ngực Thẳng Kỹ Thuật Số (DR - Direct Radiography)</strong> là kỹ thuật chẩn đoán hình ảnh kinh điển và vô cùng quan trọng nhằm khảo sát khung xương sườn, lồng ngực, bóng tim và hai phế trường phổi.</p>
        <p>Tại Smart Clinic, hệ thống X-quang kỹ thuật số trực tiếp của tập đoàn <em>Fujifilm (Nhật Bản)</em> sử dụng tấm nhận ảnh phẳng FPD thế hệ mới với công nghệ ISS độc quyền, giúp giảm hơn 50% liều tia xạ so với X-quang thông thường, chụp và truyền ảnh 4K lên hệ thống chỉ trong 3 giây.</p>
      `,
      clinicalIndications: [
        'Ho kéo dài trên 2 tuần, ho có đờm đặc, ho ra máu hoặc khó thở khi thay đổi thời tiết.',
        'Đau tức ngực khu trú khi hít sâu hoặc đau nhói vùng xương sườn sau va chạm.',
        'Sốt cao kèm ớn lạnh, nghi ngờ viêm phổi, viêm phế quản hoặc tràn dịch màng phổi.',
        'Tầm soát bệnh lao phổi, phát hiện nốt mờ phổi hoặc tổn thương u phổi ở người hút thuốc lá.',
        'Kiểm tra sức khỏe trước khi đi làm, du học hoặc đánh giá tim phổi trước khi phẫu thuật.',
      ],
      contraindications: [
        'Phụ nữ đang mang thai (đặc biệt trong 3 tháng đầu thai kỳ) chống chỉ định tương đối; nếu bắt buộc phải chụp sẽ dùng áo chì che chắn bụng cẩn thận.',
      ],
      equipment: [
        {
          name: 'Hệ Thống X-Quang Kỹ Thuật Số Trực Tiếp Fujifilm FDR Smart X',
          manufacturer: 'Fujifilm Holdings Corporation (Nhật Bản)',
          origin: 'Nhật Bản - Fujifilm',
          imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
          certifications: ['FDA (Hoa Kỳ)', 'CE Mark', 'JIS (Tiêu chuẩn Công nghiệp Nhật Bản)'],
          tagline: 'Công nghệ cảm biến phẳng ISS giảm liều tia X đến 50% nhưng cho ảnh sắc nét gấp đôi',
          description: 'Hệ thống FDR Smart X của Fujifilm trang bị tấm cảm biến phẳng không dây FPD D-EVO II. Thay vì đọc tín hiệu từ phía sau như các tấm nhận ảnh truyền thống, công nghệ ISS thu nhận tia X trực tiếp từ bề mặt trước, hạn chế tối đa sự tán xạ và hấp thụ năng lượng dư thừa vào cơ thể.',
          techSpecs: [
            { label: 'Công nghệ tấm nhận ảnh', value: 'FPD CsI (Cesium Iodide) với công nghệ ISS độc quyền' },
            { label: 'Thời gian hiển thị ảnh', value: 'Chỉ 2 - 3 giây sau khi phát tia' },
            { label: 'Xử lý hình ảnh', value: 'Dynamic Visualization II tối ưu tương phản thông minh' },
            { label: 'Mức giảm liều tia', value: 'Giảm 50% so với hệ thống CR và X-quang rửa phim' },
          ],
          patientBenefits: [
            'Cực kỳ an toàn với lượng tia phát ra tối thiểu, có áo chì bảo hộ cho các bộ phận nhạy cảm.',
            'Không phải chờ đợi rửa phim hóa chất độc hại, ảnh số hóa có thể phóng to khảo sát từng milimet.',
            'Ảnh lưu trữ vĩnh viễn trên đám mây PACS, có thể tải về điện thoại bất cứ lúc nào.',
          ],
        },
      ],
      procedureSteps: [
        {
          stepNumber: 1,
          title: 'Thay áo choàng & Tháo vật kim loại',
          duration: '3 phút',
          description: 'Bệnh nhân thay áo choàng y tế, tháo vòng cổ, dây chuyền, khuy áo kim loại và đồ lót có gọng thép.',
        },
        {
          stepNumber: 2,
          title: 'Căn chỉnh tư thế chụp ngực',
          duration: '2 phút',
          description: 'Áp sát ngực vào tấm nhận ảnh phẳng, hai tay chống hông và xoay nhẹ hai vai về phía trước để xương bả vai không che lấp phế trường.',
        },
        {
          stepNumber: 3,
          title: 'Phát tia trong 1 giây',
          duration: '1 phút',
          description: 'Kỹ thuật viên yêu cầu: "Hít sâu... Nín thở!". Máy phát tia trong chưa đầy 0.1 giây, hoàn toàn không có cảm giác gì.',
        },
        {
          stepNumber: 4,
          title: 'Xem ảnh & Bác sĩ chẩn đoán hình ảnh đọc kết quả',
          duration: '4 phút',
          description: 'Ảnh hiện ngay trên màn hình y khoa độ phân giải cao, bác sĩ đối chiếu và lập bản kết luận chẩn đoán chi tiết.',
        },
      ],
      preparationInstructions: [
        {
          title: 'Thông báo nếu nghi ngờ có thai',
          icon: 'alert-triangle',
          type: 'REQUIRED',
          details: 'Nữ giới nếu có thai hoặc nghi ngờ có thai bắt buộc phải báo ngay cho kỹ thuật viên trước khi vào phòng chụp.',
        },
        {
          title: 'Tháo bỏ đồ trang sức kim loại',
          icon: 'check',
          type: 'REQUIRED',
          details: 'Dây chuyền, khuyên cổ, cúc kim loại sẽ tạo bóng cản quang làm sai lệch kết quả chẩn đoán phổi.',
        },
      ],
      resultsTurnaroundTime: 'Có kết quả sau 10 - 15 phút (kèm phim kỹ thuật số & file ảnh HD)',
      resultsFormat: [
        'Bản in phim X-quang laser kỹ thuật số công nghệ cao',
        'Phiếu kết luận chẩn đoán hình ảnh có chữ ký Bác sĩ CKI',
        'Hình ảnh chuẩn DICOM độ nét cao lưu trữ trên tài khoản bệnh nhân',
      ],
      assignedDoctors: [
        {
          id: 'doc-03',
          name: 'BS.CKI Lê Quốc Hưng',
          title: 'Bác sĩ Chuyên khoa I',
          specialty: 'Chẩn Đoán Hình Ảnh X-Quang & CT',
          experience: '16 năm kinh nghiệm',
          rating: 4.96,
          availableDays: 'Thứ 2 – Thứ 6',
        },
      ],
      faqs: [
        {
          question: 'Chụp X-quang ngực tại Smart Clinic có hại cho sức khỏe không?',
          answer: 'Liều tia X của hệ thống Fujifilm DR tại phòng khám cực kỳ thấp (tương đương với bức xạ nền tự nhiên bạn nhận được khi đi máy bay khoảng 2 giờ). Hệ thống còn trang bị đầy đủ áo chì bảo hộ tuyến giáp và vùng bụng sinh dục, đảm bảo an toàn tối đa.',
        },
      ],
      qualityCommitments: [
        {
          title: 'Giảm 50% liều tia xạ',
          desc: 'Công nghệ cảm biến ISS độc quyền của Fujifilm Nhật Bản bảo vệ sức khỏe người bệnh.',
          icon: 'shield-check',
        },
        {
          title: 'Độ tương phản 4K rõ nét',
          desc: 'Xử lý ảnh Dynamic Visualization II giúp phát hiện sớm các đám mờ phế nang và u phổi vi mô.',
          icon: 'eye',
        },
      ],
    },
    {
      code: 'XN-CBC24',
      name: 'Tổng Phân Tích Tế Bào Máu Ngoại Vi (CBC 24 Thông Số)',
      subtitle: 'Đánh giá toàn diện các chỉ số hồng cầu, bạch cầu 5 thành phần và tiểu cầu bằng công nghệ Laser huỳnh quang chuẩn quốc tế',
      category: 'XÉT NGHIỆM',
      price: 120000,
      duration: '30 phút (trả kết quả tự động)',
      room: 'Phòng Xét Nghiệm Trung Tâm',
      icon: 'flask',
      shortDescription: 'Đánh giá thiếu máu, tình trạng viêm nhiễm, tiểu cầu và các chỉ số máu cơ bản.',
      bannerImage: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&auto=format&fit=crop&q=80',
      overviewHtml: `
        <p><strong>Tổng Phân Tích Tế Bào Máu (CBC 24 thông số - Complete Blood Count)</strong> là xét nghiệm huyết học cơ bản và quan trọng nhất trong y khoa, phản ánh tức thì tình trạng tạo máu, sức đề kháng và các rối loạn đông máu trong cơ thể.</p>
        <p>Tại Smart Clinic, hệ thống máy xét nghiệm tự động <em>Sysmex XN-550 (Nhật Bản)</em> sử dụng phương pháp đếm dòng chảy huỳnh quang bằng tia laser (Fluorescent Flow Cytometry), phân tích chính xác 24 chỉ số bao gồm số lượng hồng cầu, nồng độ huyết sắc tố Hb, thể tích hồng cầu MCV/MCH, phân loại bạch cầu 5 thành phần (Neutrophil, Lymphocyte, Monocyte, Eosinophil, Basophil) và đếm tiểu cầu.</p>
      `,
      clinicalIndications: [
        'Dấu hiệu thiếu máu: da xanh xao, niêm mạc nhợt nhạt, hoa mắt chóng mặt khi đứng lên, móng tay giòn dễ gãy.',
        'Dấu hiệu nhiễm trùng hoặc viêm: sốt cao, đau rát họng, mệt lả người, sưng hạch bạch huyết.',
        'Rối loạn đông máu: hay bị bầm tím dưới da không rõ va chạm, chảy máu chân răng, chảy máu cam khó cầm.',
        'Tầm soát bệnh lý huyết học: Thalassemia (tan máu bẩm sinh), bạch cầu cấp (ung thư máu), suy tủy.',
        'Xét nghiệm định kỳ kiểm tra sức khỏe tổng quát hoặc kiểm tra trước phẫu thuật.',
      ],
      equipment: [
        {
          name: 'Hệ Thống Phân Tích Huyết Học Tự Động Sysmex XN-550',
          manufacturer: 'Sysmex Corporation (Kobe, Nhật Bản)',
          origin: 'Nhật Bản - Sysmex',
          imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
          certifications: ['ISO 15189', 'FDA (Hoa Kỳ)', 'CE-IVD Mark', 'Chuẩn CEI'],
          tagline: 'Công nghệ Laser huỳnh quang dòng chảy phân tách bạch cầu 5 thành phần chuẩn xác 99.9%',
          description: 'Hệ thống Sysmex XN series là tiêu chuẩn vàng tại các bệnh viện tuyến trung ương và phòng xét nghiệm quốc tế. Sử dụng thuốc nhuộm huỳnh quang đặc hiệu gắn vào DNA/RNA của tế bào máu, máy chiếu tia laser xanh qua buồng đếm tế bào để phân tích độ tán xạ ánh sáng và cường độ huỳnh quang, phát hiện chính xác các tế bào máu non bất thường.',
          techSpecs: [
            { label: 'Số lượng thông số', value: '24 thông số huyết học toàn diện' },
            { label: 'Phương pháp phân tích', value: 'Fluorescent Flow Cytometry (Laser huỳnh quang)' },
            { label: 'Tốc độ xét nghiệm', value: '60 mẫu / giờ với khay nạp tự động (Sampler)' },
            { label: 'Hệ thống hút mẫu kín', value: 'Hút mẫu xuyên qua nắp cao su (Closed Tube)' },
          ],
          patientBenefits: [
            'Lấy mẫu máu tĩnh mạch nhẹ nhàng bằng kim bướm siêu mảnh BD Vacutainer, hoàn toàn êm ái.',
            'Quy trình nạp mẫu kín khép kín vô trùng tuyệt đối, an toàn sinh học cấp II.',
            'Kết quả xét nghiệm được kiểm chuẩn nội bộ (QC) 3 cấp độ mỗi ngày, cam kết độ chuẩn xác tối đa.',
          ],
        },
      ],
      procedureSteps: [
        {
          stepNumber: 1,
          title: 'Đăng ký & Dán mã vạch Barcode định danh',
          duration: '3 phút',
          description: 'Ống nghiệm chân không EDTA được dán tem mã vạch barcode gắn liền với mã bệnh nhân, loại bỏ hoàn toàn nguy cơ nhầm lẫn mẫu bệnh phẩm.',
        },
        {
          stepNumber: 2,
          title: 'Lấy mẫu máu tĩnh mạch êm ái',
          duration: '3 phút',
          description: 'Điều dưỡng giàu kinh nghiệm sử dụng kim bướm cánh bướm siêu nhỏ lấy khoảng 1.5 - 2ml máu từ tĩnh mạch tay, dán băng cá nhân xinh xắn.',
          tips: 'Giữ chặt miếng bông vô trùng trong 3-5 phút, không gập cánh tay lại để tránh vết bầm.',
        },
        {
          stepNumber: 3,
          title: 'Phân tích tự động trên máy Sysmex',
          duration: '15 phút',
          description: 'Mẫu máu được đặt lên khay nạp tự động của máy Sysmex XN-550, máy tự động lắc trộn đều, hút mẫu và chạy chu trình đếm laser.',
        },
        {
          stepNumber: 4,
          title: 'Kiểm duyệt kết quả & Trả kết quả online',
          duration: '9 phút',
          description: 'Bác sĩ xét nghiệm duyệt kết quả, tự động thông báo kết quả chi tiết lên điện thoại của bệnh nhân và lưu vào bệnh án điện tử.',
        },
      ],
      preparationInstructions: [
        {
          title: 'Không bắt buộc nhịn ăn',
          icon: 'check',
          type: 'NOTE',
          details: 'Đối với xét nghiệm công thức máu CBC thông thường, bạn không cần nhịn ăn. Tuy nhiên không nên ăn các món quá nhiều dầu mỡ ngay trước lúc lấy máu.',
        },
        {
          title: 'Uống đủ nước lọc',
          icon: 'clock',
          type: 'RECOMMENDED',
          details: 'Uống một cốc nước lọc ấm trước khi lấy máu giúp tĩnh mạch nổi rõ, lấy máu nhanh và hoàn toàn êm ái.',
        },
      ],
      resultsTurnaroundTime: 'Có kết quả sau 25 - 30 phút kể từ lúc lấy mẫu',
      resultsFormat: [
        'Bảng kết quả phân tích 24 chỉ số huyết học kèm dải tham chiếu chuẩn theo lứa tuổi và giới tính',
        'Biểu đồ tán xạ (Scattergram) hình thái bạch cầu và hồng cầu',
        'Thông báo kết quả kèm phân tích cảnh báo thông minh qua ứng dụng Smart Clinic',
      ],
      assignedDoctors: [
        {
          id: 'doc-02',
          name: 'ThS.BS Nguyễn Thị Mai Lan',
          title: 'Thạc sĩ Bác sĩ Nội trú',
          specialty: 'Nội Khoa & Huyết Học Lâm Sàng',
          experience: '14 năm kinh nghiệm',
          rating: 4.95,
          availableDays: 'Thứ 2 – Chủ Nhật',
        },
      ],
      faqs: [
        {
          question: 'Lấy máu xét nghiệm có đau không và lấy bao nhiêu máu?',
          answer: 'Tại Smart Clinic, chúng tôi sử dụng kim bướm chân không siêu nhỏ chuyên dụng của Mỹ. Cảm giác chỉ như kiến cắn nhẹ trong 1 giây. Lượng máu lấy rất ít (chỉ khoảng 1.5 - 2ml máu, tương đương nửa thìa cà phê), hoàn toàn không làm cơ thể bị mệt hay thiếu máu.',
        },
      ],
      qualityCommitments: [
        {
          title: 'Tiêu chuẩn quốc tế ISO 15189',
          desc: 'Phòng xét nghiệm tuân thủ nghiêm ngặt quy trình nội kiểm chuẩn QC 3 mức độ và tham gia ngoại kiểm quốc tế định kỳ.',
          icon: 'shield-check',
        },
        {
          title: 'Công nghệ Laser huỳnh quang tiên tiến',
          desc: 'Hệ thống Sysmex Nhật Bản phát hiện bất thường tế bào máu ở mức độ siêu vi.',
          icon: 'flask',
        },
      ],
    },
  ];

  getAllServices(): Observable<ServiceDetail[]> {
    return of(this.servicesCatalog).pipe(delay(50));
  }

  getServiceByCode(code: string): Observable<ServiceDetail | undefined> {
    const found = this.servicesCatalog.find(
      (s) => s.code.toLowerCase() === (code || '').toLowerCase()
    );
    return of(found).pipe(delay(50));
  }

  getRelatedServices(currentCode: string): Observable<ServiceDetail[]> {
    const related = this.servicesCatalog.filter(
      (s) => s.code.toLowerCase() !== (currentCode || '').toLowerCase()
    ).slice(0, 3);
    return of(related).pipe(delay(50));
  }
}
