export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const num = Number(amount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export const LIST_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getCurrentPeriodeBulan(yearOffset = 0): string {
  const d = new Date();
  const month = LIST_BULAN[d.getMonth()];
  const year = d.getFullYear() + yearOffset;
  return `${month} ${year}`;
}

export function getPeriodeOptions(yearsBack = 1, yearsForward = 1): string[] {
  const currentYear = new Date().getFullYear();
  const options: string[] = [];

  for (let y = currentYear + yearsForward; y >= currentYear - yearsBack; y--) {
    for (let m = LIST_BULAN.length - 1; m >= 0; m--) {
      options.push(`${LIST_BULAN[m]} ${y}`);
    }
  }
  return options;
}
