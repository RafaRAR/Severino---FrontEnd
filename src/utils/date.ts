export function formatDistanceToNow(dateString: string): string {
    // Truncate fractional seconds to 3 digits (milliseconds)
    const sanitizedDateString = dateString.replace(/(\.\d{3})\d+/, '$1');
    const date = new Date(sanitizedDateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) {
        return "agora mesmo";
    }

    let interval = seconds / 31536000;
    if (interval > 1) {
        return `há ${Math.floor(interval)} anos`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return `há ${Math.floor(interval)} meses`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        if (days === 1) {
            return "ontem";
        }
        return `há ${days} dias`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return `há ${Math.floor(interval)} horas`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        return `há ${Math.floor(interval)} minutos`;
    }
    return `há ${Math.floor(seconds)} segundos`;
}
