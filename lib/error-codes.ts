export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  AUTH_TOKEN_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  AUTH_UNAUTHORIZED: 'กรุณาเข้าสู่ระบบ',
  AUTH_FORBIDDEN: 'คุณไม่มีสิทธิ์เข้าถึง',
  RESOURCE_NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
  RESOURCE_CONFLICT: 'ข้อมูลซ้ำในระบบ',
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  CHAT_ROOM_NOT_FOUND: 'ไม่พบห้องแชท',
  CHAT_MESSAGE_NOT_FOUND: 'ไม่พบข้อความ',
  CHAT_PLATFORM_NOT_FOUND: 'ไม่พบแพลตฟอร์มที่เชื่อมต่อ',
  CHAT_INVALID_WEBHOOK: 'ข้อมูล webhook ไม่ถูกต้อง',
  PLATFORM_NOT_FOUND: 'ไม่พบแพลตฟอร์ม',
  SHOP_NOT_FOUND: 'ไม่พบร้านค้า',
  USER_NOT_FOUND: 'ไม่พบผู้ใช้',
  USER_VALIDATION_ERROR: 'ข้อมูลผู้ใช้ไม่ถูกต้อง',
  CREDENTIAL_NOT_FOUND: 'ไม่พบข้อมูลการเชื่อมต่อ',
  CUSTOMER_IDENTITY_NOT_FOUND: 'ไม่พบข้อมูลลูกค้า',
  USER_PLATFORM_NOT_FOUND: 'ไม่พบการเชื่อมต่อผู้ใช้กับแพลตฟอร์ม',
  INTERNAL_ERROR: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
};

export function getErrorMessage(errorCode?: string): string {
  if (!errorCode) return ERROR_MESSAGES.INTERNAL_ERROR;
  return ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.INTERNAL_ERROR;
}
