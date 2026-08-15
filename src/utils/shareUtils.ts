export interface ShareCardData {
  title: string;
  subtitle: string;
  headlineValue: string;
  headlineLabel: string;
  metric1Value: string;
  metric1Label: string;
  metric2Value: string;
  metric2Label: string;
  skillName?: string;
  skillColor?: string;
  theme?: 'dark' | 'emerald' | 'sunset';
}

/**
 * Renders a crisp 1080x1080 social media share card to a canvas and returns the Data URL (image/png)
 */
export function generateShareCardCanvas(data: ShareCardData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Background Gradient
    let bgGradient: CanvasGradient;
    if (data.theme === 'emerald') {
      bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#064E3B');
      bgGradient.addColorStop(0.5, '#047857');
      bgGradient.addColorStop(1, '#022C22');
    } else if (data.theme === 'sunset') {
      bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#7C2D12');
      bgGradient.addColorStop(0.5, '#C2410C');
      bgGradient.addColorStop(1, '#18181B');
    } else {
      // Dark Theme (Default)
      bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#131614');
      bgGradient.addColorStop(0.6, '#1C201C');
      bgGradient.addColorStop(1, '#0F1210');
    }

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Accent Glow
    const glowColor = data.skillColor || '#10B981';
    const radGlow = ctx.createRadialGradient(width * 0.8, height * 0.2, 50, width * 0.8, height * 0.2, 500);
    radGlow.addColorStop(0, `${glowColor}33`);
    radGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Card Inner Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // 4. Brand Header (Top Left)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 38px "Space Grotesk", sans-serif';
    ctx.fillText('SkillTrack', 110, 150);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText('Personal Practice Journal', 110, 185);

    // Skill Tag if present
    if (data.skillName) {
      const tagText = data.skillName.toUpperCase();
      ctx.font = '700 20px "Space Grotesk", sans-serif';
      const textWidth = ctx.measureText(tagText).width;
      const tagX = width - 110 - textWidth - 36;
      const tagY = 120;

      // Tag Background
      ctx.fillStyle = data.skillColor ? `${data.skillColor}44` : 'rgba(16, 185, 129, 0.25)';
      ctx.strokeStyle = data.skillColor || '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, textWidth + 36, 48, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tagText, tagX + 18, tagY + 31);
    }

    // 5. Main Title & Subtitle
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '600 26px "Inter", sans-serif';
    ctx.fillText(data.subtitle.toUpperCase(), 110, 310);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 56px "Space Grotesk", sans-serif';
    ctx.fillText(data.title, 110, 380);

    // 6. Big Headline Metric Block
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(110, 430, width - 220, 240, 24);
    ctx.fill();
    ctx.stroke();

    // Big Number
    ctx.fillStyle = data.skillColor || '#34D399';
    ctx.font = '800 110px "Space Grotesk", sans-serif';
    ctx.fillText(data.headlineValue, 160, 560);

    // Big Label
    ctx.fillStyle = '#E5E7EB';
    ctx.font = '600 32px "Inter", sans-serif';
    ctx.fillText(data.headlineLabel, 160, 620);

    // 7. Secondary Metrics (Two columns)
    const colWidth = (width - 220 - 30) / 2;

    // Col 1
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.roundRect(110, 700, colWidth, 180, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FBBF24'; // Amber for streaks / stats
    ctx.font = '700 52px "Space Grotesk", sans-serif';
    ctx.fillText(data.metric1Value, 145, 780);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText(data.metric1Label, 145, 830);

    // Col 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.roundRect(110 + colWidth + 30, 700, colWidth, 180, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#60A5FA';
    ctx.font = '700 52px "Space Grotesk", sans-serif';
    ctx.fillText(data.metric2Value, 110 + colWidth + 65, 780);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText(data.metric2Label, 110 + colWidth + 65, 830);

    // 8. Footer Motto
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillText('See every hour you invest in becoming better.', 110, 960);

    ctx.fillStyle = '#34D399';
    ctx.font = '600 22px "Space Grotesk", sans-serif';
    ctx.fillText('skilltrack.app', width - 110 - ctx.measureText('skilltrack.app').width, 960);

    resolve(canvas.toDataURL('image/png'));
  });
}
