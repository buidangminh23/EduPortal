import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { 
  Sparkles, 
  GraduationCap, 
  Search, 
  Filter, 
  CheckCircle, 
  MapPin, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Info,
  DollarSign,
  ArrowRight
} from 'lucide-react';

// Mock database of top universities in Vietnam with typical departments & last year cutoff scores
// Mock database of top universities in Vietnam with typical departments & last year cutoff scores
const UNIVERSITY_DB = [
  // ── HÀ NỘI ──
  { id: 'UNI01', name: 'Đại học Bách Khoa Hà Nội', code: 'HUST', city: 'Hà Nội', major: 'Công nghệ thông tin (IT1)', group: 'A00', cutoff: 27.8, fee: 'Trung bình (35-45tr/năm)', type: 'public', desc: 'Ngành học mũi nhọn hàng đầu cả nước, tỷ lệ việc làm cao, yêu cầu tư duy toán học cực tốt.', riasecMatches: ['R', 'I'] },
  { id: 'UNI02', name: 'Đại học Bách Khoa Hà Nội', code: 'HUST', city: 'Hà Nội', major: 'Kỹ thuật Điện tử - Viễn thông', group: 'A01', cutoff: 26.2, fee: 'Trung bình (30-40tr/năm)', type: 'public', desc: 'Đào tạo kỹ sư chuyên sâu phần cứng và viễn thông di động, robotics.', riasecMatches: ['R', 'I'] },
  { id: 'UNI02_1', name: 'Đại học Bách Khoa Hà Nội', code: 'HUST', city: 'Hà Nội', major: 'Kỹ thuật Ô tô', group: 'A00', cutoff: 25.5, fee: 'Trung bình (30-40tr/năm)', type: 'public', desc: 'Kỹ thuật thiết kế chế tạo cơ khí ô tô, xe điện và hệ thống thông minh.', riasecMatches: ['R', 'I'] },
  
  { id: 'UNI03', name: 'Đại học Ngoại Thương', code: 'FTU', city: 'Hà Nội', major: 'Kinh tế đối ngoại', group: 'D01', cutoff: 28.3, fee: 'Trung bình (25-35tr/năm)', type: 'public', desc: 'Thương hiệu top 1 về khối ngành kinh tế, môi trường năng động, cơ hội giao thương quốc tế cao.', riasecMatches: ['E', 'S'] },
  { id: 'UNI04', name: 'Đại học Ngoại Thương', code: 'FTU', city: 'Hà Nội', major: 'Quản trị kinh doanh', group: 'A01', cutoff: 27.5, fee: 'Trung bình (25-35tr/năm)', type: 'public', desc: 'Đào tạo tư duy lãnh đạo, khởi nghiệp, marketing chiến lược doanh nghiệp.', riasecMatches: ['E', 'C'] },
  
  { id: 'UNI05', name: 'Đại học Kinh Tế Quốc Dân', code: 'NEU', city: 'Hà Nội', major: 'Marketing', group: 'D01', cutoff: 27.2, fee: 'Chất lượng cao (40-60tr/năm)', type: 'hq', desc: 'Khoa đào tạo Marketing lâu đời và uy tín nhất miền Bắc, chú trọng nghiên cứu thị trường thực tế.', riasecMatches: ['E', 'A'] },
  { id: 'UNI06', name: 'Đại học Kinh Tế Quốc Dân', code: 'NEU', city: 'Hà Nội', major: 'Tài chính - Ngân hàng', group: 'A00', cutoff: 26.8, fee: 'Trung bình (20-30tr/năm)', type: 'public', desc: 'Hệ thống tài chính doanh nghiệp bài bản, có phòng lab thực hành thị trường chứng khoán giả lập.', riasecMatches: ['C', 'E'] },
  { id: 'UNI06_1', name: 'Đại học Kinh Tế Quốc Dân', code: 'NEU', city: 'Hà Nội', major: 'Logistics & Quản lý chuỗi cung ứng', group: 'A01', cutoff: 27.4, fee: 'Chất lượng cao (40-60tr/năm)', type: 'hq', desc: 'Tối ưu hoá vận chuyển, kho bãi và mạng lưới cung ứng quốc tế.', riasecMatches: ['C', 'E'] },

  { id: 'UNI07', name: 'Đại học Y Hà Nội', code: 'HMU', city: 'Hà Nội', major: 'Y đa khoa', group: 'B00', cutoff: 28.1, fee: 'Trung bình (40-50tr/năm)', type: 'public', desc: 'Ngành học danh giá nhất ngành Y, thời gian đào tạo 6 năm áp lực cực cao nhưng đầu ra vô cùng đảm bảo.', riasecMatches: ['I', 'S'] },
  { id: 'UNI08', name: 'Đại học Y Hà Nội', code: 'HMU', city: 'Hà Nội', major: 'Răng - Hàm - Mặt', group: 'B00', cutoff: 27.8, fee: 'Trung bình (40-50tr/năm)', type: 'public', desc: 'Thế mạnh phục hình và y khoa thẩm mỹ, kỹ năng thực hành vi phẫu lâm sàng chuẩn hóa.', riasecMatches: ['I', 'R'] },

  { id: 'UNI09', name: 'Đại học Quốc gia Hà Nội (UET)', code: 'VNU-UET', city: 'Hà Nội', major: 'Khoa học máy tính', group: 'A00', cutoff: 27.0, fee: 'Trung bình (28-35tr/năm)', type: 'public', desc: 'Chú trọng nghiên cứu giải thuật toán nâng cao, mật mã và trí tuệ nhân tạo chuyên sâu.', riasecMatches: ['I', 'R'] },
  { id: 'UNI09_1', name: 'Đại học Quốc gia Hà Nội (USSH)', code: 'VNU-USSH', city: 'Hà Nội', major: 'Báo chí', group: 'C00', cutoff: 28.5, fee: 'Trung bình (15-20tr/năm)', type: 'public', desc: 'Đào tạo kỹ năng báo chí, truyền thông đa phương tiện thực chiến.', riasecMatches: ['A', 'S'] },
  { id: 'UNI09_2', name: 'Đại học Quốc gia Hà Nội (USSH)', code: 'VNU-USSH', city: 'Hà Nội', major: 'Tâm lý học', group: 'C00', cutoff: 27.0, fee: 'Trung bình (15-20tr/năm)', type: 'public', desc: 'Nghiên cứu hành vi, tư vấn tâm lý học đường và tâm lý trị liệu.', riasecMatches: ['S', 'I'] },

  { id: 'UNI10', name: 'Đại học Luật Hà Nội', code: 'HLU', city: 'Hà Nội', major: 'Luật thương mại quốc tế', group: 'C00', cutoff: 26.5, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Trọng điểm nghiên cứu pháp lý thương mại toàn cầu, phù hợp làm cố vấn doanh nghiệp FDI.', riasecMatches: ['C', 'E'] },
  { id: 'UNI10_1', name: 'Đại học Luật Hà Nội', code: 'HLU', city: 'Hà Nội', major: 'Luật kinh tế', group: 'A00', cutoff: 25.8, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Bảo vệ lợi ích pháp lý trong kinh doanh và giải quyết tranh chấp thương mại.', riasecMatches: ['C', 'E'] },

  { id: 'UNI11', name: 'Đại học Sư Phạm Hà Nội', code: 'HNUE', city: 'Hà Nội', major: 'Sư phạm Tiếng Anh', group: 'D01', cutoff: 26.9, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Đào tạo kỹ năng giảng dạy và sư phạm chuẩn quốc tế, sinh viên được trợ cấp sinh hoạt phí.', riasecMatches: ['S', 'A'] },
  { id: 'UNI12', name: 'Đại học Sư Phạm Hà Nội', code: 'HNUE', city: 'Hà Nội', major: 'Sư phạm Toán học', group: 'A00', cutoff: 26.0, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Cái nôi đào tạo chuyên gia và giáo viên Toán chuyên cho các khối trường THPT trọng điểm.', riasecMatches: ['S', 'I'] },
  
  { id: 'UNI_DAV1', name: 'Học viện Ngoại giao', code: 'DAV', city: 'Hà Nội', major: 'Quan hệ quốc tế', group: 'D01', cutoff: 27.0, fee: 'Trung bình (35-40tr/năm)', type: 'public', desc: 'Đào tạo cán bộ ngoại giao, chuyên viên hợp tác quốc tế, tổ chức phi chính phủ.', riasecMatches: ['S', 'E'] },
  { id: 'UNI_DAV2', name: 'Học viện Ngoại giao', code: 'DAV', city: 'Hà Nội', major: 'Truyền thông quốc tế', group: 'D01', cutoff: 26.8, fee: 'Trung bình (35-40tr/năm)', type: 'public', desc: 'Sự kết hợp giữa báo chí đối ngoại, PR và kỹ năng quản trị sự kiện quốc tế.', riasecMatches: ['A', 'E'] },

  { id: 'UNI_AOF1', name: 'Học viện Tài chính', code: 'AOF', city: 'Hà Nội', major: 'Kế toán doanh nghiệp', group: 'A00', cutoff: 25.8, fee: 'Trung bình (22-25tr/năm)', type: 'public', desc: 'Kế toán tài chính, kiểm toán và phân tích báo cáo tài chính chuẩn mực.', riasecMatches: ['C', 'E'] },
  { id: 'UNI_BA1', name: 'Học viện Ngân hàng', code: 'BA', city: 'Hà Nội', major: 'Tài chính - Ngân hàng', group: 'A01', cutoff: 25.5, fee: 'Trung bình (22-25tr/năm)', type: 'public', desc: 'Nghiệp vụ ngân hàng thương mại, đầu tư chứng khoán và định giá tài sản.', riasecMatches: ['C', 'E'] },

  // ── TP. HỒ CHÍ MINH ──
  { id: 'UNI13', name: 'Đại học Bách Khoa TP.HCM', code: 'HCMUT', city: 'TP. Hồ Chí Minh', major: 'Khoa học Máy tính', group: 'A00', cutoff: 27.2, fee: 'Chất lượng cao (35-45tr/năm)', type: 'hq', desc: 'Đại học đào tạo kỹ thuật công nghệ top 1 miền Nam với kiểm định quốc tế ABET danh giá.', riasecMatches: ['R', 'I'] },
  { id: 'UNI13_1', name: 'Đại học Bách Khoa TP.HCM', code: 'HCMUT', city: 'TP. Hồ Chí Minh', major: 'Kỹ thuật Hóa học', group: 'A00', cutoff: 24.5, fee: 'Trung bình (28-32tr/năm)', type: 'public', desc: 'Công nghệ lọc hoá dầu, vật liệu polyme và công nghệ hoá sinh học ứng dụng.', riasecMatches: ['R', 'I'] },
  
  { id: 'UNI14', name: 'Đại học Kinh Tế TP.HCM', code: 'UEH', city: 'TP. Hồ Chí Minh', major: 'Kinh doanh quốc tế', group: 'A01', cutoff: 26.9, fee: 'Trung bình (30-38tr/năm)', type: 'public', desc: 'Đào tạo logistics, chuỗi cung ứng toàn cầu và quản trị ngoại thương năng động.', riasecMatches: ['E', 'C'] },
  { id: 'UNI14_1', name: 'Đại học Kinh Tế TP.HCM', code: 'UEH', city: 'TP. Hồ Chí Minh', major: 'Thương mại điện tử', group: 'D01', cutoff: 26.5, fee: 'Chất lượng cao (38-45tr/năm)', type: 'hq', desc: 'Ứng dụng kinh doanh trực tuyến, chuyển đổi số doanh nghiệp và tối ưu SEO/ADS.', riasecMatches: ['E', 'C'] },

  { id: 'UNI_UIT1', name: 'Đại học Công nghệ thông tin ĐHQG-HCM', code: 'UIT', city: 'TP. Hồ Chí Minh', major: 'Kỹ thuật Phần mềm', group: 'A00', cutoff: 26.8, fee: 'Trung bình (30-35tr/năm)', type: 'public', desc: 'Quy trình phát triển phần mềm chuẩn công nghiệp, kiến trúc phần mềm nâng cao.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_UIT2', name: 'Đại học Công nghệ thông tin ĐHQG-HCM', code: 'UIT', city: 'TP. Hồ Chí Minh', major: 'An toàn thông tin', group: 'A01', cutoff: 26.0, fee: 'Chất lượng cao (40-48tr/năm)', type: 'hq', desc: 'Bảo mật mạng, mật mã học, phân tích mã độc và phòng chống tấn công mạng.', riasecMatches: ['R', 'I'] },

  { id: 'UNI_USSH_HCM1', name: 'Đại học KHXH&NV TP.HCM', code: 'USSH-HCM', city: 'TP. Hồ Chí Minh', major: 'Quan hệ quốc tế', group: 'D01', cutoff: 26.5, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Phân tích chính sách, nghiệp vụ lãnh sự và báo chí truyền thông quốc tế.', riasecMatches: ['S', 'E'] },
  { id: 'UNI_USSH_HCM2', name: 'Đại học KHXH&NV TP.HCM', code: 'USSH-HCM', city: 'TP. Hồ Chí Minh', major: 'Ngôn ngữ Anh', group: 'D01', cutoff: 26.2, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Biên phiên dịch, văn học Anh-Mỹ và kỹ năng tiếng Anh học thuật nâng cao.', riasecMatches: ['A', 'S'] },

  { id: 'UNI_UMP1', name: 'Đại học Y Dược TP.HCM', code: 'UMP', city: 'TP. Hồ Chí Minh', major: 'Y đa khoa', group: 'B00', cutoff: 27.8, fee: 'Trung bình (45-55tr/năm)', type: 'public', desc: 'Trọng điểm y khoa miền Nam, bác sĩ thực tập nội trú tại các bệnh viện lớn.', riasecMatches: ['I', 'S'] },
  { id: 'UNI_UMP2', name: 'Đại học Y Dược TP.HCM', code: 'UMP', city: 'TP. Hồ Chí Minh', major: 'Dược học', group: 'B00', cutoff: 26.5, fee: 'Trung bình (45-55tr/năm)', type: 'public', desc: 'Nghiên cứu bào chế thuốc, quản lý dược và tư vấn dược học lâm sàng.', riasecMatches: ['I', 'R'] },

  { id: 'UNI_UTE1', name: 'Đại học Sư phạm Kỹ thuật TP.HCM', code: 'HCMUTE', city: 'TP. Hồ Chí Minh', major: 'Công nghệ kỹ thuật ô tô', group: 'A00', cutoff: 25.2, fee: 'Chất lượng cao (32-38tr/năm)', type: 'hq', desc: 'Hệ thống cơ điện tử ô tô, chẩn đoán lỗi, bảo dưỡng ô tô thông minh.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_ULAW_HCM', name: 'Đại học Luật TP.HCM', code: 'ULAW', city: 'TP. Hồ Chí Minh', major: 'Luật thương mại', group: 'C00', cutoff: 26.0, fee: 'Trung bình (20-24tr/năm)', type: 'public', desc: 'Đào tạo luật sư tư vấn giải quyết tranh chấp kinh tế, hợp đồng thương mại.', riasecMatches: ['C', 'E'] },

  { id: 'UNI15', name: 'Đại học RMIT Việt Nam', code: 'RMIT', city: 'TP. Hồ Chí Minh', major: 'Thiết kế ứng dụng sáng tạo', group: 'D01', cutoff: 20.0, fee: 'Tư thục/Quốc tế (>250tr/năm)', type: 'intl', desc: 'Bằng đại học Australia trực tiếp, tập trung tối đa tư duy thiết kế, portfolio thực chiến xuất sắc.', riasecMatches: ['A', 'E'] },
  { id: 'UNI15_1', name: 'Đại học RMIT Việt Nam', code: 'RMIT', city: 'TP. Hồ Chí Minh', major: 'Công nghệ thông tin', group: 'A01', cutoff: 21.0, fee: 'Tư thục/Quốc tế (>250tr/năm)', type: 'intl', desc: 'Chương trình chuẩn quốc tế, mạng lưới cựu sinh viên toàn cầu chất lượng cao.', riasecMatches: ['R', 'I'] },

  { id: 'UNI_FUL1', name: 'Đại học Fulbright Việt Nam', code: 'FUV', city: 'TP. Hồ Chí Minh', major: 'Khoa học tích hợp', group: 'A01', cutoff: 22.5, fee: 'Tư thục/Quốc tế (>200tr/năm)', type: 'intl', desc: 'Mô hình khai phóng của Mỹ, khuyến khích liên ngành toán học và khoa học tự nhiên.', riasecMatches: ['I', 'A'] },

  // ── ĐÀ NẴNG ──
  { id: 'UNI16', name: 'Đại học FPT', code: 'FPTU', city: 'Đà Nẵng', major: 'Kỹ thuật phần mềm', group: 'A01', cutoff: 21.0, fee: 'Tư thục/Quốc tế (70-90tr/năm)', type: 'intl', desc: 'Chương trình đào tạo gắn liền với thực tập doanh nghiệp tại FPT Software, giáo trình 100% tiếng Anh.', riasecMatches: ['R', 'I'] },
  
  { id: 'UNI_DUT1', name: 'Đại học Bách khoa - ĐH Đà Nẵng', code: 'DUT', city: 'Đà Nẵng', major: 'Công nghệ thông tin (Đặc thù)', group: 'A00', cutoff: 25.8, fee: 'Trung bình (25-30tr/năm)', type: 'public', desc: 'Đào tạo Kỹ sư CNTT trọng điểm miền Trung, liên kết doanh nghiệp Nhật Bản.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_DUT2', name: 'Đại học Bách khoa - ĐH Đà Nẵng', code: 'DUT', city: 'Đà Nẵng', major: 'Kỹ thuật Điều khiển & Tự động hóa', group: 'A00', cutoff: 24.5, fee: 'Trung bình (25-30tr/năm)', type: 'public', desc: 'Hệ thống SCADA, PLC, tự động hoá dây chuyền nhà máy thông minh.', riasecMatches: ['R', 'I'] },

  { id: 'UNI_UE_DN1', name: 'Đại học Kinh tế - ĐH Đà Nẵng', code: 'DUE', city: 'Đà Nẵng', major: 'Quản trị kinh doanh', group: 'D01', cutoff: 24.8, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Đào tạo quản lý, khởi nghiệp, marketing thích ứng kinh tế số miền Trung.', riasecMatches: ['E', 'C'] },
  { id: 'UNI_UE_DN2', name: 'Đại học Kinh tế - ĐH Đà Nẵng', code: 'DUE', city: 'Đà Nẵng', major: 'Quản trị dịch vụ du lịch & lữ hành', group: 'A01', cutoff: 24.0, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Thế mạnh đào tạo quản lý khách sạn, resort cao cấp tại thủ phủ du lịch Đà Nẵng.', riasecMatches: ['S', 'E'] },

  { id: 'UNI_UFL_DN1', name: 'Đại học Ngoại ngữ - ĐH Đà Nẵng', code: 'UFL', city: 'Đà Nẵng', major: 'Ngôn ngữ Anh (Sư phạm)', group: 'D01', cutoff: 25.0, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Đào tạo giáo viên tiếng Anh trung học, phương pháp sư phạm hiện đại.', riasecMatches: ['S', 'A'] },

  // ── CẦN THƠ ──
  { id: 'UNI_CTU1', name: 'Đại học Cần Thơ', code: 'CTU', city: 'Cần Thơ', major: 'Công nghệ thông tin', group: 'A00', cutoff: 24.0, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Trọng điểm nghiên cứu CNTT và phát triển phần mềm vùng Đồng bằng Sông Cửu Long.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_CTU2', name: 'Đại học Cần Thơ', code: 'CTU', city: 'Cần Thơ', major: 'Kinh doanh quốc tế', group: 'D01', cutoff: 24.2, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Phù hợp định hướng xuất nhập khẩu nông thuỷ sản và giao thương quốc tế khu vực Tây Nam Bộ.', riasecMatches: ['E', 'C'] },
  { id: 'UNI_CTU3', name: 'Đại học Cần Thơ', code: 'CTU', city: 'Cần Thơ', major: 'Y đa khoa (Khoa Y)', group: 'B00', cutoff: 25.5, fee: 'Trung bình (35-42tr/năm)', type: 'public', desc: 'Đào tạo bác sĩ đa khoa phục vụ mạng lưới y tế công lập miền Tây.', riasecMatches: ['I', 'S'] },

  // ── HUẾ ──
  { id: 'UNI_HUI1', name: 'Trường Đại học Y Dược - Đại học Huế', code: 'HUMP', city: 'Huế', major: 'Y đa khoa', group: 'B00', cutoff: 26.0, fee: 'Trung bình (35-40tr/năm)', type: 'public', desc: 'Cơ sở đào tạo y khoa uy tín hàng đầu miền Trung, thế mạnh nghiên cứu khoa học y học.', riasecMatches: ['I', 'S'] },
  { id: 'UNI_HUI2', name: 'Trường Đại học Sư phạm - Đại học Huế', code: 'HUE', city: 'Huế', major: 'Sư phạm Toán học', group: 'A00', cutoff: 23.5, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Đào tạo giáo viên toán chất lượng cao, phát triển tư duy học sinh.', riasecMatches: ['S', 'I'] },

  // ── BÌNH DƯƠNG ──
  { id: 'UNI_VGU1', name: 'Đại học Việt Đức', code: 'VGU', city: 'Bình Dương', major: 'Khoa học máy tính', group: 'A00', cutoff: 23.0, fee: 'Tư thục/Quốc tế (80-100tr/năm)', type: 'intl', desc: 'Đại học công lập mô hình Đức, bằng do trường đối tác Đức cấp, học hoàn toàn bằng tiếng Anh.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_VIN1', name: 'Đại học VinUniversity', code: 'VinUni', city: 'Hà Nội', major: 'Y khoa', group: 'B00', cutoff: 24.5, fee: 'Tư thục/Quốc tế (>300tr/năm)', type: 'intl', desc: 'Liên kết Ivy League Cornell & Penn, học bổng hào phóng, trang thiết bị tối tân.', riasecMatches: ['I', 'S'] },
  { id: 'UNI_VIN2', name: 'Đại học VinUniversity', code: 'VinUni', city: 'Hà Nội', major: 'Quản trị kinh doanh', group: 'D01', cutoff: 23.0, fee: 'Tư thục/Quốc tế (>300tr/năm)', type: 'intl', desc: 'Đào tạo tư duy kinh doanh toàn cầu, thực tập sớm tại các tập đoàn đa quốc gia.', riasecMatches: ['E', 'C'] }
];

export default function UniversityMatchmakerTab({ student }) {
  const { careerTestScores } = useContext(AppContext);
  
  // Local UI States
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [targetScore, setTargetScore] = useState(25.5);
  const [selectedField, setSelectedField] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [maxFeeType, setMaxFeeType] = useState('ALL');
  
  const [matchedResults, setMatchedResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRoadmapUni, setSelectedRoadmapUni] = useState(null);
  const [roadmapChecklist, setRoadmapChecklist] = useState([]);
  const [savedFavorites, setSavedFavorites] = useState([]);

  // Calculate predicted GPA and suggested score
  const studentGrades = Object.values(student?.grades || {});
  const studentAvg = studentGrades.length ? (studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length) : 8.0;
  // Dynamic predicted exam score simulation
  const predictedExamScore = parseFloat((studentAvg * 3).toFixed(1));

  // Fetch RIASEC codes if student completed the test
  const riasecScores = careerTestScores ? careerTestScores.find(s => s.studentId === student?.id) : null;
  const topRiasecTraits = [];
  if (riasecScores) {
    const entries = Object.entries(riasecScores).filter(([k]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(k));
    entries.sort((a, b) => b[1] - a[1]);
    if (entries[0]) topRiasecTraits.push(entries[0][0]);
    if (entries[1]) topRiasecTraits.push(entries[1][0]);
  }

  // Load saved choices from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`matchmaker_favs_${student?.id}`);
    if (saved) {
      setSavedFavorites(JSON.parse(saved));
    }
  }, [student?.id]);

  // Autofill with predicted exam score
  const handleAutofillScore = () => {
    setTargetScore(predictedExamScore);
  };

  const handleMatch = () => {
    let filtered = UNIVERSITY_DB.filter(uni => {
      // Filter by exam group
      if (selectedGroup !== 'ALL' && uni.group !== selectedGroup) return false;
      
      // Filter by location
      if (selectedCity !== 'ALL' && uni.city !== selectedCity) return false;
      
      // Filter by fee type
      if (maxFeeType !== 'ALL' && uni.type !== maxFeeType) return false;

      // Filter by interest field
      if (selectedField !== 'ALL') {
        const majorLower = uni.major.toLowerCase();
        const matchesField = {
          'TECH': uni.riasecMatches.includes('R') || uni.riasecMatches.includes('I') && (
            majorLower.includes('máy tính') || 
            majorLower.includes('tin') || 
            majorLower.includes('kỹ thuật') || 
            majorLower.includes('công nghệ') || 
            majorLower.includes('hóa học') || 
            majorLower.includes('vật lý') || 
            majorLower.includes('điện tử') || 
            majorLower.includes('tự động') || 
            majorLower.includes('phần mềm') || 
            majorLower.includes('hệ thống') || 
            majorLower.includes('viễn thông') || 
            majorLower.includes('ô tô') || 
            majorLower.includes('khoa học dữ liệu')
          ),
          'BIZ': uni.riasecMatches.includes('E') || uni.riasecMatches.includes('C') || 
            majorLower.includes('kinh tế') || 
            majorLower.includes('quản trị') || 
            majorLower.includes('marketing') || 
            majorLower.includes('tài chính') || 
            majorLower.includes('ngân hàng') || 
            majorLower.includes('kế toán') || 
            majorLower.includes('logistics') || 
            majorLower.includes('thương mại') || 
            majorLower.includes('kinh doanh'),
          'MED': uni.group === 'B00' || 
            majorLower.includes('y') || 
            majorLower.includes('răng') || 
            majorLower.includes('dược') || 
            majorLower.includes('điều dưỡng') || 
            majorLower.includes('chăm sóc') || 
            majorLower.includes('lâm sàng'),
          'EDU_SOC': uni.riasecMatches.includes('S') || 
            majorLower.includes('sư phạm') || 
            majorLower.includes('luật') || 
            majorLower.includes('báo chí') || 
            majorLower.includes('tâm lý') || 
            majorLower.includes('ngôn ngữ') || 
            majorLower.includes('đông phương') || 
            majorLower.includes('quan hệ quốc tế') || 
            majorLower.includes('ngoại giao') || 
            majorLower.includes('truyền thông'),
          'ART': uni.riasecMatches.includes('A') || 
            majorLower.includes('thiết kế') || 
            majorLower.includes('nghệ thuật') || 
            majorLower.includes('kiến trúc')
        };
        if (!matchesField[selectedField]) return false;
      }

      return true;
    });

    // Add probability calculations & RIASEC match index
    const processed = filtered.map(uni => {
      const diff = targetScore - uni.cutoff;
      let probLabel = '';
      let probColor = '';
      let probPercent = 0;
      
      if (diff >= 1.5) {
        probLabel = 'Rất cao';
        probColor = 'var(--accent-secondary)';
        probPercent = 95;
      } else if (diff >= 0) {
        probLabel = 'An toàn';
        probColor = '#0f766e';
        probPercent = 78;
      } else if (diff >= -1.2) {
        probLabel = 'Cần cố gắng';
        probColor = '#d97706';
        probPercent = 55;
      } else {
        probLabel = 'Thử thách lớn';
        probColor = '#dc2626';
        probPercent = 25;
      }

      // Check if matches top student RIASEC profile
      let riasecMatchCount = 0;
      topRiasecTraits.forEach(trait => {
        if (uni.riasecMatches.includes(trait)) riasecMatchCount++;
      });
      const riasecMatchPercent = topRiasecTraits.length > 0 ? (riasecMatchCount / topRiasecTraits.length) * 100 : 50;

      return {
        ...uni,
        probLabel,
        probColor,
        probPercent,
        riasecMatchPercent,
        diff
      };
    });

    // Sort by best fit
    processed.sort((a, b) => b.riasecMatchPercent - a.riasecMatchPercent || b.diff - a.diff);

    setMatchedResults(processed);
    setHasSearched(true);
    setSelectedRoadmapUni(null); // Clear roadmap view
  };

  // Generate a customized step-by-step study plan to hit the college cutoff score
  const handleGenerateRoadmap = (uni) => {
    setSelectedRoadmapUni(uni);
    
    // Create roadmap steps based on target score difference
    const diff = uni.cutoff - targetScore;
    const isAbove = diff <= 0;
    
    const steps = [
      { id: 1, title: 'Đánh giá chi tiết điểm nền tảng', desc: `Phân tích chi tiết 3 môn khối ${uni.group}. Hiện tại điểm mục tiêu của bạn là ${targetScore}đ so với điểm chuẩn của trường là ${uni.cutoff}đ. ${isAbove ? 'Bạn đang ở ngưỡng an toàn, cần tập trung duy trì phong độ.' : `Bạn đang thiếu khoảng ${(diff).toFixed(1)}đ, cần tập trung nâng cao điểm số môn yếu nhất.`}`, done: false },
      { id: 2, title: `Luyện đề thi thử chuyên sâu nhóm ${uni.group}`, desc: 'Giải tối thiểu 10 đề chính thức từ các năm trước của Bộ GD&ĐT dưới áp lực thời gian thực (50-90 phút/đề).', done: false },
      { id: 3, title: 'Chinh phục phần Vận dụng (7-8.5đ)', desc: 'Xây dựng sơ đồ tư duy các chuyên đề lý thuyết nâng cao. Loại bỏ hoàn toàn các lỗi sai ngớ ngẩn ở câu nhận biết.', done: false }
    ];

    if (!isAbove) {
      steps.push({ id: 4, title: 'Chiến thuật gia tăng điểm số (+1.5đ)', desc: 'Đăng ký học kèm gia sư hoặc tham gia phòng Lab thí nghiệm ảo/flashcards để lấp đầy phần kiến thức bị hổng lớn.', done: false });
    } else {
      steps.push({ id: 4, title: 'Tối ưu hóa thời gian & tâm lý thi cử', desc: 'Rèn luyện tốc độ làm đề trắc nghiệm nhanh, kiểm soát 10 câu khó nhất để tranh tài vào khối ngành cao điểm.', done: false });
    }

    steps.push({ id: 5, title: 'Đăng ký nguyện vọng & chuẩn bị hồ sơ', desc: `Đăng ký nguyện vọng 1 mã ngành ${uni.code} - ${uni.major} trên cổng thông tin Bộ GD&ĐT.`, done: false });

    setRoadmapChecklist(steps);
  };

  const handleToggleChecklist = (id) => {
    setRoadmapChecklist(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  const handleSaveFavorite = (uni) => {
    let updated;
    const exists = savedFavorites.some(f => f.id === uni.id);
    if (exists) {
      updated = savedFavorites.filter(f => f.id !== uni.id);
    } else {
      updated = [...savedFavorites, uni];
    }
    setSavedFavorites(updated);
    localStorage.setItem(`matchmaker_favs_${student?.id}`, JSON.stringify(updated));
  };

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Filters & Inputs Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={20} color="var(--accent-primary)" />
          <span>Định Hướng Ngành Học & Đại Học AI</span>
        </h2>

        {/* RIASEC Profile Hook */}
        {topRiasecTraits.length > 0 ? (
          <div style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <GraduationCap size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>Mã tính cách RIASEC: {topRiasecTraits.join('-')}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Hệ thống định hướng AI đã tự động ghi nhận mã tính cách của bạn và sẽ ưu tiên đề xuất các khối ngành học tương thích cao nhất.
            </p>
          </div>
        ) : (
          <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
            <p style={{ fontSize: '0.78rem', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
              💡 Bạn chưa làm khảo sát tính cách hướng nghiệp RIASEC. Làm khảo sát tại mục <strong>Tư Vấn & Hướng Nghiệp</strong> để AI phân tích chuẩn xác hơn.
            </p>
          </div>
        )}

        {/* Form Controls */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Tổ hợp khối thi xét tuyển</label>
            <select 
              value={selectedGroup} 
              onChange={e => setSelectedGroup(e.target.value)}
              className="form-control"
              style={{ background: 'white' }}
            >
              <option value="ALL">-- Tất cả tổ hợp --</option>
              <option value="A00">A00 (Toán, Vật lý, Hóa học)</option>
              <option value="A01">A01 (Toán, Vật lý, Tiếng Anh)</option>
              <option value="B00">B00 (Toán, Hóa học, Sinh học)</option>
              <option value="C00">C00 (Văn, Lịch sử, Địa lý)</option>
              <option value="D01">D01 (Toán, Ngữ văn, Tiếng Anh)</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Điểm thi mục tiêu</label>
              <button 
                type="button" 
                onClick={handleAutofillScore}
                style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Lấy điểm dự báo AI ({predictedExamScore}đ)
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="range" 
                min="15.0" 
                max="30.0" 
                step="0.1" 
                value={targetScore} 
                onChange={e => setTargetScore(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)', minWidth: '55px', textAlign: 'right' }}>
                {targetScore.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Ngành học quan tâm</label>
            <select 
              value={selectedField} 
              onChange={e => setSelectedField(e.target.value)}
              className="form-control"
              style={{ background: 'white' }}
            >
              <option value="ALL">-- Tất cả ngành học --</option>
              <option value="TECH">Kỹ thuật & Công nghệ thông tin</option>
              <option value="BIZ">Kinh tế, Tài chính & Quản trị</option>
              <option value="MED">Y khoa & Chăm sóc sức khỏe</option>
              <option value="EDU_SOC">Sư phạm & Khoa học Xã hội</option>
              <option value="ART">Nghệ thuật & Sáng tạo Thiết kế</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Khu vực địa lý</label>
            <select 
              value={selectedCity} 
              onChange={e => setSelectedCity(e.target.value)}
              className="form-control"
              style={{ background: 'white' }}
            >
              <option value="ALL">-- Tất cả khu vực --</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Cần Thơ">Cần Thơ</option>
              <option value="Huế">Huế</option>
              <option value="Bình Dương">Bình Dương</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Loại hình & Học phí</label>
            <select 
              value={maxFeeType} 
              onChange={e => setMaxFeeType(e.target.value)}
              className="form-control"
              style={{ background: 'white' }}
            >
              <option value="ALL">Tất cả loại hình trường</option>
              <option value="public">Công lập (Học phí đại trà)</option>
              <option value="hq">Chất lượng cao / Tự chủ tài chính</option>
              <option value="intl">Tư thục / Liên kết Quốc tế</option>
            </select>
          </div>

          <button 
            type="button" 
            onClick={handleMatch}
            className="btn btn-primary"
            style={{ width: '100%', gap: '8px', marginTop: '6px' }}
          >
            <Search size={16} />
            <span>Phân tích & Khớp trường bằng AI</span>
          </button>
        </div>

        {/* Saved list */}
        {savedFavorites.length > 0 && (
          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} color="var(--accent-secondary)" />
              <span>Nguyện vọng đã lưu ({savedFavorites.length})</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedFavorites.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' }}>{f.code} • Khối {f.group}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.major}</span>
                  </div>
                  <button 
                    onClick={() => handleGenerateRoadmap(f)} 
                    style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(99,102,241,0.08)', border: 'none', color: 'var(--accent-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Xem lộ trình
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {hasSearched ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Đề xuất khớp nguyện vọng AI ({matchedResults.length})</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Ưu tiên theo độ tương thích tính cách nghề nghiệp</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '450px', overflowY: 'auto' }} className="custom-scroll">
              {matchedResults.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không tìm thấy phương án khớp hoàn toàn. Hãy thử giảm điểm thi mục tiêu hoặc mở rộng khối thi, khu vực.
                </div>
              ) : (
                matchedResults.map(uni => {
                  const isFav = savedFavorites.some(f => f.id === uni.id);
                  const isViewingRoadmap = selectedRoadmapUni?.id === uni.id;
                  
                  return (
                    <div 
                      key={uni.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '16px', 
                        borderColor: isViewingRoadmap ? 'var(--accent-primary)' : 'var(--border-card)', 
                        background: isViewingRoadmap ? 'rgba(99, 102, 241, 0.02)' : 'rgba(255,255,255,0.7)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'var(--accent-primary)', color: 'white' }}>
                              {uni.code}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Khối {uni.group} • Điểm chuẩn 2025: <strong>{uni.cutoff}</strong>
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
                            {uni.major}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {uni.name} ({uni.city})
                          </span>
                        </div>

                        {/* Save icon action */}
                        <button 
                          onClick={() => handleSaveFavorite(uni)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isFav ? '#e11d48' : '#cbd5e1' }}
                          title={isFav ? 'Hủy lưu nguyện vọng' : 'Lưu nguyện vọng'}
                        >
                          ♥
                        </button>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.4 }}>
                        {uni.desc}
                      </p>

                      {/* AI Probabilities and RIASEC match indices */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '12px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', margin: '10px 0' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Cơ hội trúng tuyển (AI đánh giá)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: uni.probColor }}>
                              {uni.probLabel} ({uni.probPercent}%)
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {uni.diff >= 0 ? `+${uni.diff.toFixed(1)}đ` : `${uni.diff.toFixed(1)}đ`}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Độ khớp tính cách RIASEC</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={14} /> {uni.riasecMatchPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-card)', paddingTop: '10px', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={12} /> {uni.fee}
                        </span>

                        <button 
                          onClick={() => handleGenerateRoadmap(uni)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                        >
                          <span>Lập lộ trình ôn tập AI</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <GraduationCap size={48} strokeWidth={1} style={{ marginBottom: '16px', color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Chưa có kết quả phân tích</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
              Vui lòng chọn tổ hợp thi, điều chỉnh điểm mục tiêu và các tiêu chí tuyển sinh bên trái, sau đó nhấn <strong>Phân tích & Khớp trường</strong> để AI tiến hành đối chiếu.
            </p>
          </div>
        )}

        {/* Dynamic Study Roadmap Checklist */}
        {selectedRoadmapUni && (
          <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '2.5px solid var(--accent-primary-glow)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--accent-primary)" />
              <span>Lộ Trình Chuẩn Bị Ôn Thi AI — Ngành {selectedRoadmapUni.major} ({selectedRoadmapUni.code})</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Bám sát danh mục checklist do AI gợi ý dưới đây nhằm nâng cao khả năng cạnh tranh điểm thi khối {selectedRoadmapUni.group} vào trường.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roadmapChecklist.map(step => (
                <div 
                  key={step.id} 
                  onClick={() => handleToggleChecklist(step.id)}
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    padding: '12px', 
                    background: step.done ? 'rgba(16, 185, 129, 0.04)' : 'white', 
                    borderRadius: '10px', 
                    border: '1px solid', 
                    borderColor: step.done ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-card)', 
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={step.done}
                    onChange={() => {}} // Handle click on container instead
                    style={{ marginTop: '2px', accentColor: 'var(--accent-secondary)' }}
                  />
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 700, textDecoration: step.done ? 'line-through' : 'none', color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {step.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
