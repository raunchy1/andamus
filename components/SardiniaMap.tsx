"use client";

export function SardiniaMap() {
  return (
    <div className="relative mx-auto max-w-[500px] mb-8">
      <svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        {/* Sardinia island outline - from Natural Earth geographic data */}
        <path
          d="M109.2,568.9L113,570.8L115.5,569.2L110.1,574.8L106.7,588.4L100.1,596.8L95.6,593.4L80.6,571.7L79.7,564.6L90.4,561.1L109.2,568.9Z M68.9,539.4L68.9,561.3L55.2,560.6L49.3,551.5L52.7,542.4Z M150.7,598.1L140.5,583.7L132.9,574.4L123.5,570.3L116.4,567.2L113.9,560.6L105.5,557.9L103.7,546.1L97.6,543.7L95.6,544.1L93.9,537.5L88.9,535.9L88,528.4L98.4,507.3L87.2,493.7L94.6,485.4L93.7,477L99.5,471.8L111.8,471.6L129.3,468.9L149.2,482.2L159.5,492.6L176.4,496.5L175,504.8L179.4,514.9L184.3,518.8L189.7,536.3L204.3,546.1L207.8,551.8L209.4,559.9L213,570.8L186.7,574.8L176.2,579.6L168,576.5L160.3,587.3Z M60.6,80.1L53,95.8L46.3,90.7L48.2,84L60.8,77.1L61.4,68.2L68.9,67.4L74.4,63.2L76,68.2L78.4,76Z M92.1,239.1L88.8,225.2L75.9,214.8L70.6,198.2L44.9,200L44.9,189.8L31.4,196.2L26.4,194.5L29.2,184.9L37.4,173L39.8,170.3L33.5,168.9L26,161.8L44.6,123.5L38.4,113.8L38.6,103.2L43.9,103.3L50.2,105.4L48.4,113.6L70.1,131.1L121.3,137.5L152.8,127.2L177.2,113.8L192.1,115.5L223.4,110.7L239.3,104.7L246.3,105.9L250.2,118.2L229.3,122.1L227.9,126.2L231.3,130.3L250.3,130.8L262.3,147.7L260.5,165.2L258,172.4L290.8,180.8L302.7,179.4L307.8,193.2L305.3,205.9L306.8,214.3L324.7,216.2L329.1,223.1L318.1,231.7L309.2,242.1L304.5,249.2L262.8,265.4L239.6,248.8L216.1,243.4L212.9,239.1L208.6,238.9L206.7,245.2L203.1,251.3L166.8,264.2L157.6,264.4L151.6,260.7L140,248.4L121.3,236L108.1,242.6L92.1,239.1Z M456.4,177.9L459.8,195.9L466.3,198.8L475.6,208.5L474.2,216.8L470.2,228.4L456.5,247.7L443.5,253.7L428.6,267.7L423.1,279.6L410.3,292L396.5,286.8L394.3,291.6L384.6,298.7L344.6,325.2L335.9,330.1L334.4,334.4L340.3,337.8L337.8,346.1L331.6,353.5L330.6,361L308.5,365.7L309.1,383.5L297.5,373.9L277,368.2L252.1,357.4L244,341.2L262.5,331.4L267,323.4L260.2,304.5L253.3,289.5L245.8,287.6L171.8,288.8L166.4,280.2L152.9,272.6L153.4,262.1L160.4,265.2L177.5,256.6L204.9,250.2L205.9,242.7L210.1,238.6L214.1,240.1L217.3,244L255.4,262.5L266.8,261.2L305.5,248L315.1,239.7L319.9,228.6L330.6,220.9L312.2,216.8L306,211.6L353.8,199.2L362.3,187.8L372.5,178.2L390.6,171L405.5,157.1L407.9,144.7L406.6,131.2L398.8,119.7L388.6,107.1L377.6,100.8L366,99.9L350.6,102.7L341.4,102.9L341.2,112.2L335.9,121.4L324.7,131.4L306.2,138.7L280.5,147.8L264.4,151.9L250.8,148.2L247,135.2L233.6,133.6L228.9,129.3L229.9,124.2L250.4,120.5L251.1,110.5L264.3,96.8L280.5,89.2L286.1,72.7L296.5,67.8L317,61.1L338.5,54L345.6,47.5L350.6,31.8L357.4,23.5L371.3,21.9L387.9,26.8L403.7,36.1L422,48.2L436.6,59L450.8,74.2L460.1,91.5L466.6,112.5L470.3,132.5L470,150.8L466.5,165.5L456.4,177.9Z"
          fill="#1a1a1a"
          stroke="#333"
          strokeWidth="1.5"
        />

        {/* City markers with real geographic coordinates */}
        {/* Cagliari: lon 9.1217, lat 39.2238 */}
        <circle cx="288" cy="531.9" r="5" fill="white" />
        <text x="296" y="535.9" fill="white" fontSize="11" fontWeight="500">Cagliari</text>

        {/* Sassari: lon 8.5556, lat 40.7259 */}
        <circle cx="136" cy="161.8" r="5" fill="white" />
        <text x="81" y="165.8" fill="white" fontSize="11" fontWeight="500">Sassari</text>

        {/* Olbia: lon 9.4992, lat 40.9234 */}
        <circle cx="389.3" cy="113.1" r="5" fill="white" />
        <text x="397.3" y="103.1" fill="white" fontSize="11" fontWeight="500">Olbia</text>

        {/* Nuoro: lon 9.3310, lat 40.3217 */}
        <circle cx="344.2" cy="261.4" r="5" fill="white" />
        <text x="352.2" y="251.4" fill="white" fontSize="11" fontWeight="500">Nuoro</text>

        {/* Oristano: lon 8.5916, lat 39.9036 */}
        <circle cx="145.6" cy="364.4" r="5" fill="white" />
        <text x="85.6" y="368.4" fill="white" fontSize="11" fontWeight="500">Oristano</text>

        {/* Tortolì: lon 9.6580, lat 39.9281 */}
        <circle cx="432" cy="358.4" r="5" fill="white" />
        <text x="440" y="370.4" fill="white" fontSize="11" fontWeight="500">Tortolì</text>

        {/* Animated route lines */}
        <line x1="288" y1="531.9" x2="344.2" y2="261.4" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
          strokeDasharray="276" strokeDashoffset="276" className="animate-draw-line" />
        <line x1="288" y1="531.9" x2="136" y2="161.8" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
          strokeDasharray="400" strokeDashoffset="400" className="animate-draw-line" style={{ animationDelay: '0.5s' }} />
        <line x1="344.2" y1="261.4" x2="136" y2="161.8" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
          strokeDasharray="231" strokeDashoffset="231" className="animate-draw-line" style={{ animationDelay: '1s' }} />
        <line x1="344.2" y1="261.4" x2="389.3" y2="113.1" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
          strokeDasharray="155" strokeDashoffset="155" className="animate-draw-line" style={{ animationDelay: '1.5s' }} />
        <line x1="432" y1="358.4" x2="288" y2="531.9" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
          strokeDasharray="225" strokeDashoffset="225" className="animate-draw-line" style={{ animationDelay: '2s' }} />
        <line x1="432" y1="358.4" x2="344.2" y2="261.4" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
          strokeDasharray="131" strokeDashoffset="131" className="animate-draw-line" style={{ animationDelay: '2.5s' }} />
      </svg>
    </div>
  );
}
