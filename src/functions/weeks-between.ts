export function weeksBetween(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
}
