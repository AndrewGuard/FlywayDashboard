import type { CLSMetric, INPMetric, FCPMetric, LCPMetric, TTFBMetric } from 'web-vitals';

type WebVitalsMetric = CLSMetric | INPMetric | FCPMetric | LCPMetric | TTFBMetric;

const reportWebVitals = (onPerfEntry?: (metric: WebVitalsMetric) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
