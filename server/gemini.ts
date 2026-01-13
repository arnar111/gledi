import { createCanvas } from "canvas";

/**
 * Generate a fun cartoon-style calendar image for an event
 */
export async function generateEventPoster(
    eventTitle: string,
    eventDescription: string,
    eventDate: Date,
    location?: string | null
): Promise<string> {
    const width = 400;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Calendar body (white rounded rectangle)
    const calX = 60;
    const calY = 80;
    const calW = 280;
    const calH = 260;
    const radius = 20;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    roundRect(ctx, calX + 8, calY + 8, calW, calH, radius);
    ctx.fill();

    // Calendar white body
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, calX, calY, calW, calH, radius);
    ctx.fill();

    // Calendar header (red top bar)
    ctx.fillStyle = "#e74c3c";
    roundRectTop(ctx, calX, calY, calW, 70, radius);
    ctx.fill();

    // Calendar rings
    ctx.fillStyle = "#bdc3c7";
    for (let i = 0; i < 2; i++) {
        const ringX = calX + 80 + i * 120;
        const ringY = calY - 10;
        ctx.beginPath();
        ctx.roundRect(ringX - 8, ringY, 16, 40, 4);
        ctx.fill();
    }

    // Month name
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(months[eventDate.getMonth()], width / 2, calY + 45);

    // Day number (large)
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 100px Arial";
    ctx.textAlign = "center";
    ctx.fillText(eventDate.getDate().toString(), width / 2, calY + 180);

    // Year
    ctx.fillStyle = "#7f8c8d";
    ctx.font = "24px Arial";
    ctx.fillText(eventDate.getFullYear().toString(), width / 2, calY + 230);

    // Event title at bottom
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    const shortTitle = eventTitle.length > 30 ? eventTitle.substring(0, 27) + "..." : eventTitle;
    ctx.fillText(shortTitle, width / 2, height - 25);

    // Convert to base64
    const buffer = canvas.toBuffer("image/png");
    return `data:image/png;base64,${buffer.toString("base64")}`;
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function roundRectTop(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
