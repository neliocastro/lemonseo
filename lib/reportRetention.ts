/** Relatórios são expurgados 120 dias após a criação (ver README, seção "Persistência"). */
export const REPORT_RETENTION_DAYS = 120;

export function getReportExpiryDate(createdAt: string): Date {
  const created = new Date(createdAt);
  const expiry = new Date(created);
  expiry.setDate(expiry.getDate() + REPORT_RETENTION_DAYS);
  return expiry;
}

export function isReportExpired(createdAt: string): boolean {
  return getReportExpiryDate(createdAt).getTime() <= Date.now();
}
