"use client";

import { motion } from "framer-motion";

export function SardiniaMap() {
  return (
    <svg viewBox="0 0 380 540" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="islandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#181818" />
          <stop offset="100%" stopColor="#141414" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="380" height="540" fill="#0a0a0a" rx="12" />

      {/* Grid lines */}
      <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4 4">
        <line x1="95.6" y1="20" x2="95.6" y2="520" />
        <line x1="190.0" y1="20" x2="190.0" y2="520" />
        <line x1="284.4" y1="20" x2="284.4" y2="520" />
        <line x1="20" y1="484.4" x2="360" y2="484.4" />
        <line x1="20" y1="286.8" x2="360" y2="286.8" />
        <line x1="20" y1="89.2" x2="360" y2="89.2" />
      </g>

      {/* Grid labels */}
      <g fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">
        <text x="95.6" y="16" textAnchor="middle">8.5&deg;E</text>
        <text x="190.0" y="16" textAnchor="middle">9.0&deg;E</text>
        <text x="284.4" y="16" textAnchor="middle">9.5&deg;E</text>
        <text x="14" y="487.4" textAnchor="middle">39.0&deg;N</text>
        <text x="14" y="289.8" textAnchor="middle">40.0&deg;N</text>
        <text x="14" y="92.2" textAnchor="middle">41.0&deg;N</text>
      </g>

      {/* Shadow */}
      <path d="M42.6,175.0 L50.1,177.1 L50.5,175.0 L58.3,172.8 L64.2,176.9 L62.5,179.0 L64.5,181.1 L68.2,189.2 L74.8,192.8 L79.4,204.9 L79.6,210.1 L76.2,220.3 L78.8,222.6 L83.4,223.2 L95.3,233.4 L91.4,247.5 L92.5,250.4 L90.2,254.9 L91.0,260.1 L95.7,266.5 L96.5,274.1 L89.8,279.8 L83.7,281.4 L77.0,281.1 L82.3,286.2 L81.4,290.5 L78.3,293.9 L80.0,300.7 L79.4,308.8 L85.5,311.9 L87.0,314.5 L92.5,308.8 L99.8,308.0 L107.0,312.6 L108.9,321.7 L107.1,330.3 L102.5,340.0 L98.3,345.5 L90.7,335.4 L88.0,337.6 L88.6,346.1 L90.1,346.9 L88.1,353.4 L89.8,357.0 L89.5,364.3 L93.1,368.5 L89.3,379.6 L80.4,391.3 L77.8,392.9 L76.5,397.1 L81.7,400.3 L81.7,404.8 L74.6,413.4 L76.9,415.2 L79.0,420.7 L82.7,421.0 L86.7,429.7 L84.5,434.2 L73.4,442.3 L74.4,446.0 L79.0,448.1 L86.7,456.6 L86.0,461.8 L91.2,463.5 L96.4,470.7 L92.2,476.1 L90.3,470.9 L85.6,468.5 L84.5,465.9 L77.1,467.8 L72.2,465.7 L70.3,472.5 L72.5,479.1 L76.6,486.2 L80.3,494.9 L82.3,496.3 L88.1,493.4 L89.4,489.5 L89.6,482.6 L92.2,476.4 L98.3,474.9 L103.7,475.7 L106.8,478.2 L110.9,478.5 L112.7,484.1 L110.8,487.5 L115.3,494.5 L119.8,495.7 L121.9,499.8 L118.7,508.6 L126.8,508.2 L139.1,502.3 L140.2,500.0 L155.0,508.2 L159.0,508.3 L161.4,511.7 L165.5,511.4 L175.3,505.6 L178.8,501.7 L195.2,490.0 L201.5,475.9 L196.1,470.2 L194.7,463.5 L196.6,458.0 L204.6,449.2 L211.1,445.1 L216.3,446.7 L220.6,451.1 L224.1,447.1 L229.3,443.7 L236.4,442.4 L239.7,444.7 L249.2,445.3 L251.4,446.9 L254.0,447.3 L258.3,451.6 L263.1,453.1 L275.1,462.7 L284.5,460.6 L287.9,461.5 L291.0,465.1 L294.8,461.1 L299.5,459.4 L300.7,453.8 L299.6,450.1 L300.7,440.2 L304.7,432.4 L311.7,426.9 L307.3,424.6 L305.9,419.1 L307.8,410.7 L314.9,396.3 L314.4,389.9 L312.5,389.3 L313.7,380.8 L316.0,378.9 L317.0,367.7 L315.2,358.7 L320.7,347.0 L319.3,333.9 L322.5,321.0 L324.6,318.8 L321.9,315.2 L322.0,308.5 L326.3,304.7 L322.7,300.0 L322.7,292.9 L325.2,289.7 L326.3,283.1 L329.0,280.1 L331.6,272.8 L323.3,268.5 L317.2,261.7 L311.2,248.7 L310.9,239.9 L312.3,235.2 L318.7,226.6 L328.5,217.4 L335.4,214.5 L339.0,209.4 L339.5,205.3 L342.7,202.2 L349.0,188.6 L349.2,185.0 L343.9,182.6 L341.9,176.6 L335.0,171.1 L333.2,162.2 L335.0,156.6 L333.3,153.2 L328.1,149.5 L328.1,141.0 L322.7,138.3 L319.8,134.7 L320.7,130.4 L324.0,122.5 L316.2,119.6 L313.1,115.0 L309.4,114.0 L314.9,108.5 L309.6,108.5 L307.2,110.0 L301.6,109.7 L290.3,107.4 L291.4,105.7 L292.5,105.5 L297.0,106.5 L297.2,106.4 L305.2,98.4 L303.1,96.9 L307.9,92.0 L316.3,95.3 L316.9,91.3 L312.2,91.8 L305.7,88.0 L302.0,91.6 L298.7,88.0 L292.5,87.5 L291.9,81.6 L295.1,74.4 L300.8,72.3 L300.1,69.3 L290.2,61.3 L289.4,64.4 L281.8,64.2 L278.6,62.1 L273.8,60.7 L267.6,59.0 L261.0,57.6 L253.4,56.0 L245.9,54.6 L238.3,52.6 L232.7,50.7 L227.0,49.7 L221.3,45.7 L217.6,42.8 L212.8,40.8 L208.1,40.2 L202.4,42.4 L196.8,43.8 L189.2,45.1 L181.7,45.7 L174.1,44.7 L168.4,42.8 L162.8,41.8 L159.0,42.2 L153.3,43.6 L147.7,45.9 L142.0,48.7 L134.4,50.7 L126.9,51.7 L121.2,53.6 L113.7,56.6 L108.0,59.6 L104.2,62.5 L100.4,66.5 L94.8,70.4 L91.0,74.4 L87.2,78.3 L83.4,81.3 L79.7,84.3 L74.0,88.2 L68.3,92.2 L62.7,98.1 L57.0,104.0 L51.3,110.9 L47.6,115.9 L45.7,121.8 L43.8,127.7 L41.9,133.7 L40.0,139.6 L38.1,145.5 L37.2,151.5 L36.2,157.4 L36.2,163.3 L37.2,167.3 L39.1,171.2 L42.6,175.0 Z" fill="rgba(0,0,0,0.3)" />

      {/* Main island */}
      <path d="M39.6,172.0 L47.1,174.1 L47.5,172.0 L55.3,169.8 L61.2,173.9 L59.5,176.0 L61.5,178.1 L65.2,186.2 L71.8,189.8 L76.4,201.9 L76.6,207.1 L73.2,217.3 L75.8,219.6 L80.4,220.2 L92.3,230.4 L88.4,244.5 L89.5,247.4 L87.2,251.9 L88.0,257.1 L92.7,263.5 L93.5,271.1 L86.8,276.8 L80.7,278.4 L74.0,278.1 L79.3,283.2 L78.4,287.5 L75.3,290.9 L77.0,297.7 L76.4,305.8 L82.5,308.9 L84.0,311.5 L89.5,305.8 L96.8,305.0 L104.0,309.6 L105.9,318.7 L104.1,327.3 L99.5,337.0 L95.3,342.5 L87.7,332.4 L85.0,334.6 L85.6,343.1 L87.1,343.9 L85.1,350.4 L86.8,354.0 L86.5,361.3 L90.1,365.5 L86.3,376.6 L77.4,388.3 L74.8,389.9 L73.5,394.1 L78.7,397.3 L78.7,401.8 L71.6,410.4 L73.9,412.2 L76.0,417.7 L79.7,418.0 L83.7,426.7 L81.5,431.2 L70.4,439.3 L71.4,443.0 L76.0,445.1 L83.7,453.6 L83.0,458.8 L88.2,460.5 L93.4,467.7 L89.2,473.1 L87.3,467.9 L82.6,465.5 L81.5,462.9 L74.1,464.8 L69.2,462.7 L67.3,469.5 L69.5,476.1 L73.6,483.2 L77.3,491.9 L79.3,493.3 L85.1,490.4 L86.4,486.5 L86.6,479.6 L89.2,473.4 L95.3,471.9 L100.7,472.7 L103.8,475.2 L107.9,475.5 L109.7,481.1 L107.8,484.5 L112.3,491.5 L116.8,492.7 L118.9,496.8 L115.7,505.6 L123.8,505.2 L136.1,499.3 L137.2,497.0 L152.0,505.2 L156.0,505.3 L158.4,508.7 L162.5,508.4 L172.3,502.6 L175.8,498.7 L192.2,487.0 L198.5,472.9 L193.1,467.2 L191.7,460.5 L193.6,455.0 L201.6,446.2 L208.1,442.1 L213.3,443.7 L217.6,448.1 L221.1,444.1 L226.3,440.7 L233.4,439.4 L236.7,441.7 L246.2,442.3 L248.4,443.9 L251.0,444.3 L255.3,448.6 L260.1,450.1 L272.1,459.7 L281.5,457.6 L284.9,458.5 L288.0,462.1 L291.8,458.1 L296.5,456.4 L297.7,450.8 L296.6,447.1 L297.7,437.2 L301.7,429.4 L308.7,423.9 L304.3,421.6 L302.9,416.1 L304.8,407.7 L311.9,393.3 L311.4,386.9 L309.5,386.3 L310.7,377.8 L313.0,375.9 L314.0,364.7 L312.2,355.7 L317.7,344.0 L316.3,330.9 L319.5,318.0 L321.6,315.8 L318.9,312.2 L319.0,305.5 L323.3,301.7 L319.7,297.0 L319.7,289.9 L322.2,286.7 L323.3,280.1 L326.0,277.1 L328.6,269.8 L320.3,265.5 L314.2,258.7 L308.2,245.7 L307.9,236.9 L309.3,232.2 L315.7,223.6 L325.5,214.4 L332.4,211.5 L336.0,206.4 L336.5,202.3 L339.7,199.2 L346.0,185.6 L346.2,182.0 L340.9,179.6 L338.9,173.6 L332.0,168.1 L330.2,159.2 L332.0,153.6 L330.3,150.2 L325.1,146.5 L325.1,138.0 L319.7,135.3 L316.8,131.7 L317.7,127.4 L321.0,119.5 L313.2,116.6 L310.1,112.0 L306.4,111.0 L311.9,105.5 L306.6,105.5 L304.2,107.0 L298.6,106.7 L287.3,104.4 L288.4,102.7 L289.5,102.5 L294.0,103.5 L294.2,103.4 L302.2,95.4 L300.1,93.9 L304.9,89.0 L313.3,92.3 L313.9,88.3 L309.2,88.8 L302.7,85.0 L299.0,88.6 L295.7,85.0 L289.5,84.5 L288.9,78.6 L292.1,71.4 L297.8,69.3 L297.1,66.3 L287.2,58.3 L286.4,61.4 L278.8,61.2 L275.6,59.1 L270.8,57.7 L264.6,56.0 L258.0,54.6 L250.4,53.0 L242.9,51.6 L235.3,49.6 L229.7,47.7 L224.0,46.7 L218.3,42.7 L214.6,39.8 L209.8,37.8 L205.1,37.2 L199.4,39.4 L193.8,40.8 L186.2,42.1 L178.7,42.7 L171.1,41.7 L165.4,39.8 L159.8,38.8 L156.0,39.2 L150.3,40.6 L144.7,42.9 L139.0,45.7 L131.4,47.7 L123.9,48.7 L118.2,50.6 L110.7,53.6 L105.0,56.6 L101.2,59.5 L97.4,63.5 L91.8,67.4 L88.0,71.4 L84.2,75.3 L80.4,78.3 L76.7,81.3 L71.0,85.2 L65.3,89.2 L59.7,95.1 L54.0,101.0 L48.3,107.9 L44.6,112.9 L42.7,118.8 L40.8,124.7 L38.9,130.7 L37.0,136.6 L35.1,142.5 L34.2,148.5 L33.2,154.4 L33.2,160.3 L34.2,164.3 L36.1,168.2 L39.6,172.0 Z" fill="url(#islandGrad)" stroke="#2a2a2a" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Islands */}
      <path d="M74.8,456.8 L78.6,458.7 L80.4,462.7 L81.4,466.6 L80.4,470.6 L77.6,473.6 L72.9,475.5 L68.2,474.5 L65.3,471.6 L64.4,467.6 L65.3,463.7 L68.2,460.7 L71.0,457.7 L74.8,456.8 Z" fill="url(#islandGrad)" stroke="#2a2a2a" strokeWidth="1" />
      <path d="M52.1,452.8 L55.9,454.8 L57.8,457.7 L56.8,461.7 L54.0,463.7 L50.2,463.7 L47.4,461.7 L46.4,457.7 L48.3,454.8 L52.1,452.8 Z" fill="url(#islandGrad)" stroke="#2a2a2a" strokeWidth="1" />
      <path d="M48.3,81.3 L52.1,79.3 L55.9,75.3 L58.7,71.4 L59.7,69.4 L58.7,67.4 L54.9,68.4 L52.1,70.4 L49.3,73.4 L46.4,77.3 L48.3,81.3 Z" fill="url(#islandGrad)" stroke="#2a2a2a" strokeWidth="1" />
      <path d="M259.9,39.8 L264.6,40.8 L269.3,39.8 L272.2,37.8 L271.2,34.8 L267.4,33.8 L262.7,34.8 L259.9,36.8 L258.9,38.8 L259.9,39.8 Z" fill="url(#islandGrad)" stroke="#2a2a2a" strokeWidth="1" />

      {/* SARDEGNA label */}
      <text x="190" y="280" fill="rgba(255,255,255,0.04)" fontSize="48" fontWeight="900" textAnchor="middle" letterSpacing="12">SARDEGNA</text>

      {/* Routes */}
      <g>
        <motion.path
          d="M213.0,440.2 L112.9,305.6"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.0, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.0 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }
          }}
        />
        <motion.path
          d="M213.0,440.2 L99.7,452.0"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.15, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.15 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 1.65 }
          }}
        />
        <motion.path
          d="M106.1,143.3 L60.4,176.5"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.3, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.3 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 1.8 }
          }}
        />
        <motion.path
          d="M106.1,143.3 L283.6,104.3"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.44999999999999996, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.44999999999999996 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 1.95 }
          }}
        />
        <motion.path
          d="M283.6,104.3 L252.3,223.6"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.6, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.6 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 2.1 }
          }}
        />
        <motion.path
          d="M252.3,223.6 L314.3,301.6"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.75, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.75 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 2.25 }
          }}
        />
        <motion.path
          d="M112.9,305.6 L106.1,143.3"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 0.8999999999999999, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 0.8999999999999999 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 2.4 }
          }}
        />
        <motion.path
          d="M213.0,440.2 L252.3,223.6"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 1.05, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 1.05 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 2.55 }
          }}
        />
        <motion.path
          d="M252.3,223.6 L112.9,305.6"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 1.2, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 1.2 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 2.7 }
          }}
        />
        <motion.path
          d="M60.4,176.5 L283.6,104.3"
          fill="none"
          stroke="#e63946"
          strokeWidth="1"
          strokeOpacity={0.6}
          strokeDasharray="6 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -20] }}
          transition={{
            pathLength: { duration: 1.5, delay: 1.3499999999999999, ease: "easeOut" },
            opacity: { duration: 0.5, delay: 1.3499999999999999 },
            strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear", delay: 2.8499999999999996 }
          }}
        />
      </g>

      {/* Cities */}
      <g>
        <g className="cursor-pointer">
          <circle cx="213.0" cy="440.2" r="4" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="221.0" y="444.2" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Cagliari</text>
          <motion.circle
            cx="213.0" cy="440.2" r="4"
            fill="none" stroke="#e63946" strokeWidth="1" strokeOpacity={0.4}
            animate={{ r: [4, 16], strokeOpacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </g>
        <g className="cursor-pointer">
          <circle cx="106.1" cy="143.3" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="114.1" y="147.3" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Sassari</text>
        </g>
        <g className="cursor-pointer">
          <circle cx="283.6" cy="104.3" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="291.6" y="108.3" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Olbia</text>
        </g>
        <g className="cursor-pointer">
          <circle cx="252.3" cy="223.6" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="260.3" y="227.6" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Nuoro</text>
        </g>
        <g className="cursor-pointer">
          <circle cx="112.9" cy="305.6" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="120.9" y="309.6" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Oristano</text>
        </g>
        <g className="cursor-pointer">
          <circle cx="314.3" cy="301.6" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="322.3" y="305.6" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Tortoli</text>
        </g>
        <g className="cursor-pointer">
          <circle cx="60.4" cy="176.5" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="68.4" y="180.5" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Alghero</text>
        </g>
        <g className="cursor-pointer">
          <circle cx="99.7" cy="452.0" r="3" fill="#e63946" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="107.7" y="456.0" fill="#ffffff" fontSize="10" fontWeight="600"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>Carbonia</text>
        </g>
      </g>
    </svg>
  );
}
