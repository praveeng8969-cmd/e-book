export interface IntuitiveData {
  simpleExplanation: string;
  realWorldAnalogy: string;
  keyTakeaway: string;
  commonMisconception?: string;
  everydayExampleTitle?: string;
}

export const intuitiveKnowledgeBase: Record<string, IntuitiveData> = {
  // CHAPTER 1: BASIC CONCEPTS
  '1-1-definition-systems': {
    everydayExampleTitle: 'Drawing a Box Around What You Care About',
    simpleExplanation:
      'Thermodynamics is essentially the science of energy: how heat moves, how energy transforms into mechanical work, and how matter responds. A "System" is simply whatever object or region you decide to put your magnifying glass on (like water boiling in a kettle), the "Surroundings" is the entire rest of the universe, and the "Boundary" is the imaginary or real wall separating the two.',
    realWorldAnalogy:
      'Imagine your kitchen. If you are watching water heat up in a pot, the water inside is your **System**. The kitchen stove, air, and your house are the **Surroundings**. The pot wall and lid form the **Boundary**. If the lid can pop up and down, it has a movable flexible boundary that can do work!',
    keyTakeaway:
      'Everything in thermodynamics begins with defining your system boundary clearly. Energy and matter can only cross boundaries.',
    commonMisconception:
      'Misconception: A boundary must be a physical rigid wall. Fact: Boundaries can be completely imaginary lines in space (like the inlet and outlet of a jet engine pipe).',
  },

  '1-2-types-of-systems': {
    everydayExampleTitle: 'Closed vs Open vs Isolated in Daily Life',
    simpleExplanation:
      'Systems are categorized by what is allowed to cross their borders: mass (matter) and energy (heat/work). A Closed System lets energy in and out but traps the matter inside. An Open System lets both matter and energy flow freely through it. An Isolated System locks everything down—neither mass nor heat/work can enter or escape.',
    realWorldAnalogy:
      'Think of making soup: (1) A pressure cooker sealed shut with no steam escaping is a **Closed System** (heat enters, but soup mass stays inside). (2) An open pot boiling on the stove with steam billowing out is an **Open System** (steam and heat both escape). (3) A super-insulated thermos flask with a tightly sealed cork is an **Isolated System** (soup stays hot, nothing enters or leaves).',
    keyTakeaway:
      'Closed = Mass trapped, heat/work allowed. Open = Mass and energy both flow. Isolated = Zero mass, zero energy transfer.',
    commonMisconception:
      'Misconception: A closed system cannot do work. Fact: A closed piston-cylinder expands and does displacement work while trapping all gas particles inside.',
  },

  '1-3-approaches-continuum': {
    everydayExampleTitle: 'Looking at Individual Molecules vs The Big Picture',
    simpleExplanation:
      'Instead of tracking millions of trillions of bouncing air molecules one by one (Microscopic / Statistical approach), classical engineering thermodynamics looks at the big macroscopic picture: average temperature, pressure, and density. The "Continuum" hypothesis says air behaves like a continuous smooth fluid rather than empty space filled with scattered flying dots, which is valid as long as the molecules collide frequently.',
    realWorldAnalogy:
      'Think of viewing a digital photo. Up close at the pixel level, you see individual RGB dots (microscopic). But when you stand back, the pixels blur together into a seamless smooth photograph (continuum / macroscopic). As long as the pixels are densely packed, you can talk about the "color of the sky" without listing every pixel coordinate.',
    keyTakeaway:
      'Whenever Knudsen number Kn < 0.01 (dense gas with frequent collisions), we treat matter as a continuous smooth substance and measure single numbers for Pressure and Temperature.',
    commonMisconception:
      'Continuum breaks down only in extreme outer space vacuum or microscopic nanotechnology channels where gas molecules are so far apart they rarely collide.',
  },

  '1-4-equilibrium-pure-substance': {
    everydayExampleTitle: 'When Things Settle Down Completely',
    simpleExplanation:
      'Thermodynamic equilibrium means nothing is changing or trying to change internally. For a system to be in true equilibrium, temperatures must be equal throughout (no hot spots), pressures must balance (no moving walls), and chemical reactions must be finished (no tendency to react). A Pure Substance has the same uniform chemical identity everywhere.',
    realWorldAnalogy:
      'Imagine leaving a cup of hot coffee on a table in a closed room. When you first put it down, heat flows (no thermal equilibrium), steam swirls (no mechanical equilibrium). After an hour, the coffee reaches room temperature, the liquid is still, and everything is at peace: the coffee-room system has reached complete equilibrium.',
    keyTakeaway:
      'Equilibrium = Thermal balance (same T) + Mechanical balance (same P) + Chemical balance (same composition).',
    commonMisconception:
      'Is ice water a pure substance? YES! Ice is solid H₂O and water is liquid H₂O—chemically identical. But liquid air + gaseous air is NOT pure because nitrogen evaporates faster than oxygen, changing the composition of the vapor.',
  },

  '1-5-properties-state-process': {
    everydayExampleTitle: 'Intensive vs Extensive: The Knife Test',
    simpleExplanation:
      'Properties are characteristics that describe the system right now. "Intensive" properties do not depend on how big the sample is (temperature, pressure, density). "Extensive" properties scale directly with size (total weight, total volume, total energy).',
    realWorldAnalogy:
      'Take a glass of water at 25°C and cut it in half with an imaginary knife. Each half still has a temperature of 25°C and density of 1000 kg/m³ (**Intensive**—did not change). But each half now has half the mass, half the volume, and half the total energy (**Extensive**—split in half).',
    keyTakeaway:
      'State properties depend only on where you are right now (altitude on a mountain), not how you got there. Heat and work are paths (the trail you walked), not properties.',
    commonMisconception:
      'Gibbs Phase Rule (P + F = C + 2) simply tells you how many knobs you can independently turn (e.g. adjust temperature AND pressure) before fixing all other properties.',
  },

  // CHAPTER 2: ZEROTH LAW
  '2-1-zeroth-law-statement': {
    everydayExampleTitle: 'The Thermometer Rule: Transitivity of Temperature',
    simpleExplanation:
      'The Zeroth Law says: If Object A is at the same temperature as Object B, and Object B is at the same temperature as Object C, then Object A and Object C must also be at the exact same temperature. This simple common-sense fact is the entire scientific justification for why thermometers work.',
    realWorldAnalogy:
      'Imagine you want to know if you have a fever. Instead of pressing your forehead against a healthy person to compare, you put a thermometer (Object B) in your mouth (Object A). Once the thermometer equilibrates, you read its number. Because the thermometer is also calibrated against a known standard (Object C), you know your exact temperature!',
    keyTakeaway:
      'Zeroth Law enables temperature measurement: A = B and B = C implies A = C.',
    commonMisconception:
      'Why called "Zeroth"? Because the 1st and 2nd laws were formulated in the 1800s. In 1931, scientists realized temperature definition was even more foundational than energy conservation, so they placed it at position Zero.',
  },

  '2-2-thermometric-principles': {
    everydayExampleTitle: 'How Different Gadgets Sense Heat',
    simpleExplanation:
      'To build a thermometer, you need a physical property that changes smoothly and predictably when heated. Liquid thermometers use expanding mercury/alcohol volume. Digital sensors use changing electrical wire resistance (RTD). High-temperature probes use tiny voltages created where two different metals meet (Seebeck effect in Thermocouples).',
    realWorldAnalogy:
      'Think of tuning a guitar in the sun: as the metal string heats up, its length and tension change, altering the sound pitch. Any property that responds reliably to heat can act as a thermometer dial.',
    keyTakeaway:
      'RTD = Resistance changes with heat; Thermocouple = Voltage generated by temperature difference; Gas thermometer = Gas pressure rises with temperature.',
  },

  '2-3-temperature-scales': {
    everydayExampleTitle: 'Absolute Zero & The Triple Point Reference',
    simpleExplanation:
      'Temperature measures the average kinetic jiggling of atoms. At Absolute Zero (0 Kelvin or -273.15°C), all thermal motion stops. To calibrate modern thermometers with absolute precision, scientists use the "Triple Point of Water" (273.16 K or 0.01°C at 0.00613 bar), where ice, liquid water, and water vapor coexist in perfect harmony.',
    realWorldAnalogy:
      'Think of setting your bathroom scale to zero before stepping on it. If your zero mark is sloppy, every weight measurement is wrong. The Triple Point of Water is nature’s indestructible, unshakeable zero-calibration mark.',
    keyTakeaway:
      'Always use absolute Kelvin (K = °C + 273.15) for thermodynamic gas equations. 0 K is the absolute floor of nature.',
  },

  // CHAPTER 3: ENERGY INTERACTIONS & 1ST LAW
  '3-1-work-interactions': {
    everydayExampleTitle: 'Work = Pushing Against a Resisting Force',
    simpleExplanation:
      'Thermodynamic work happens whenever a boundary moves against a force, like hot expanding gas pushing a piston in your car engine ($W = \\int P dV$). If a container is rigid (like a steel scuba tank), no matter how hot you make the gas, displacement work is exactly ZERO because volume does not change.',
    realWorldAnalogy:
      'Pumping a bicycle tire: As you push down the pump handle, you squeeze air into smaller volume against high pressure. You are doing work ON the air. When you release a compressed soda bottle cap and gas shoots it across the room, the gas does work ON the surroundings.',
    keyTakeaway:
      'Displacement work W = Area under P-v curve. If volume does not change (dV = 0), non-flow boundary work is ZERO.',
    commonMisconception:
      'Free expansion of gas into a vacuum: A gas rushes into empty space. Does it do work? NO! There is zero resisting pressure (P_ext = 0), so work done is strictly ZERO.',
  },

  '3-2-processes-pv-relations': {
    everydayExampleTitle: 'The 5 Classic Process Paths',
    simpleExplanation:
      'When a gas changes state, it follows a specific path on the Pressure-Volume map: (1) Constant Volume (Isochoric, rigid box), (2) Constant Pressure (Isobaric, weighted piston), (3) Constant Temperature (Isothermal, slow heating in water bath), (4) Reversible Adiabatic (Isentropic, rapid expansion in insulated cylinder), (5) Polytropic (real-world general expansion $PV^n = C$).',
    realWorldAnalogy:
      'Think of traveling between two cities: you could take a flat highway (isobaric), an uphill winding mountain pass (adiabatic), or a scenic valley loop. You end up at the destination, but the fuel used (heat) and miles driven (work) depend entirely on the road you chose.',
    keyTakeaway:
      'Steepness on P-v diagram: Adiabatic is steeper than Isothermal by a factor of gamma (1.4 for air).',
  },

  '3-3-first-law-closed-systems': {
    everydayExampleTitle: 'The Bank Account Rule of Energy (1st Law)',
    simpleExplanation:
      'Energy cannot be created or destroyed, only transferred or transformed. For a closed system: Heat added to the system ($\delta Q$) either goes into doing external work ($\delta W$) or gets stored as internal thermal energy of the molecules ($dU$). In simple terms: $\\delta Q = dU + \\delta W$.',
    realWorldAnalogy:
      'Your bank account: If your employer deposits $1,000 (Heat In), and you spend $700 on shopping (Work Out), your account balance increases by exactly $300 (Internal Energy Stored). Money in = Money spent + Balance change.',
    keyTakeaway:
      'For a complete cycle that returns to the starting state: Total Net Heat in = Total Net Work out ($\\oint \\delta Q = \\oint \\delta W$).',
  },

  '3-4-sfee-open-systems': {
    everydayExampleTitle: 'Flowing Energy in Pipes, Turbines & Nozzles (SFEE)',
    simpleExplanation:
      'When fluid flows steadily through a device (like steam in a turbine or jet fuel in a rocket nozzle), the energy carried into the inlet (enthalpy + kinetic + potential) plus any heat added equals the energy leaving at the outlet plus any work produced.',
    realWorldAnalogy:
      'Water sliding down a water park flume: At the top, you have height (potential energy) and gentle pressure. As you shoot out at the bottom, your height turned into blistering speed (kinetic energy). Total energy is conserved every inch of the slide.',
    keyTakeaway:
      'Nozzle converts enthalpy into high exit velocity ($V_2 = \\sqrt{2000(h_1-h_2)}$). Turbine extracts enthalpy to spin an electrical generator.',
  },

  '3-5-unsteady-flow-charging': {
    everydayExampleTitle: 'Why Your Scuba Tank Gets Hot When Filling Up',
    simpleExplanation:
      'When you rapidly fill an empty insulated tank with gas from a supply line, the gas inside gets significantly hotter than the supply line temperature! In fact, for an ideal gas, the final temperature inside is $T_2 = \\gamma T_i$ (e.g. 1.4 times supply temp in Kelvin).',
    realWorldAnalogy:
      'Imagine forcing people into an already crowded subway car. The people pushing from behind do "flow work" on the people entering. That extra compressive energy has nowhere to escape in an insulated tank, so it turns directly into intense thermal heat.',
    keyTakeaway:
      'Rapid tank filling converts pipeline flow work into stored internal energy, making the gas hotter ($T_2 = 1.4 T_i$ for air).',
  },

  // CHAPTER 4: SECOND LAW
  '4-1-second-law-statements': {
    everydayExampleTitle: 'The One-Way Arrow of Nature & Heat Engines',
    simpleExplanation:
      'The First Law says energy is conserved; the Second Law tells you which way energy is allowed to flow naturally. Heat always flows spontaneously from HOT to COLD, never backwards. You can never build a heat engine that turns 100% of heat into useful mechanical work without rejecting some waste heat to the cooler surroundings (Kelvin-Planck statement).',
    realWorldAnalogy:
      'Think of a waterfall: water falls naturally from high elevation to low elevation and can turn a waterwheel. But you cannot have a waterwheel that operates without any water draining out at the bottom! The draining water is the waste heat every real engine must reject.',
    keyTakeaway:
      'Kelvin-Planck: No engine is 100% efficient; waste heat is mandatory. Clausius: Refrigerators require electricity/work to pump heat from cold to hot.',
  },

  '4-2-carnot-cycle-theorems': {
    everydayExampleTitle: 'The Ideal Ceiling of Efficiency (Carnot)',
    simpleExplanation:
      'In 1824, Sadi Carnot proved that no heat engine operating between two temperature reservoirs ($T_H$ and $T_L$) can ever be more efficient than an ideal reversible engine. Its maximum possible efficiency depends ONLY on the two temperatures: $\\eta_{\\text{Carnot}} = 1 - \\frac{T_L}{T_H}$.',
    realWorldAnalogy:
      'Think of temperature difference as the height of a waterfall. The higher the drop (higher $T_H$ and lower $T_L$), the more potential energy you can extract. If the reservoir and environment are at the same temperature ($T_H = T_L$), no work can ever be extracted.',
    keyTakeaway:
      'To increase power plant efficiency, make the combustion flame hotter ($T_H \\uparrow$) or the cooling water colder ($T_L \\downarrow$).',
  },

  // CHAPTER 5: ENTROPY
  '5-1-clausius-inequality': {
    everydayExampleTitle: 'The Test for Whether an Invention is Physically Real',
    simpleExplanation:
      'Clausius Inequality ($\oint \frac{\delta Q}{T} \le 0$) is nature’s lie-detector test for thermodynamic cycles. If the cyclic integral equals 0, the cycle is perfectly reversible. If it is negative, the cycle is real and irreversible. If it is positive (> 0), the cycle violates the laws of physics and is impossible.',
    realWorldAnalogy:
      'Think of checking your bank balance after a shopping trip. If your bank statement shows you ended up with MORE money without making any deposits, you know the bank made an accounting error. Clausius inequality verifies nature’s energy ledger.',
    keyTakeaway:
      'Cyclic Integral: = 0 (Reversible), < 0 (Irreversible/Real), > 0 (Impossible/Scam).',
  },

  '5-2-entropy-principle': {
    everydayExampleTitle: 'Entropy: The Natural Drift Toward Randomness',
    simpleExplanation:
      'Entropy is a measure of molecular disorder and energy dispersal. Whenever anything happens in the universe—hot tea cooling, tires rubbing on asphalt, or gas expanding—energy spreads out and universe entropy increases ($(\\Delta S)_{\\text{univ}} \\ge 0$).',
    realWorldAnalogy:
      'Think of a neat stack of papers on your desk. If a gust of wind blows through, the papers scatter everywhere across the room (high entropy). They will never spontaneously fly back into a neat sorted stack on their own. Order requires work; disorder happens naturally.',
    keyTakeaway:
      'Total entropy of the universe never decreases: $(\\Delta S)_{\\text{system}} + (\\Delta S)_{\\text{surroundings}} \\ge 0$.',
  },

  // CHAPTER 6: EXERGY & AVAILABILITY
  '6-1-available-energy': {
    everydayExampleTitle: 'Exergy: The Useful Part of Your Energy',
    simpleExplanation:
      'Not all Joules of energy are equal. 1,000 Joules of high-temperature flame at 1500°C can do lots of work (high Exergy / Availability). But 1,000 Joules of lukewarm ocean water at 20°C can do almost zero work (zero Exergy). Exergy measures the maximum useful work you can extract before reaching dead environmental equilibrium.',
    realWorldAnalogy:
      'Think of cash vs gift cards with expiration dates. $100 in crisp currency (high exergy) can buy anything anywhere. A $100 store voucher that expired yesterday (dead state) still has paper, but zero purchasing power.',
    keyTakeaway:
      'Energy is conserved (1st law), but Exergy is destroyed by friction, mixing, and unrestrained heat transfer (2nd law).',
  },

  '6-2-gouy-stodola-irreversibility': {
    everydayExampleTitle: 'The Cost of Imperfections: Gouy-Stodola Theorem',
    simpleExplanation:
      'Whenever energy transfers across a large temperature gap or suffers from fluid friction, entropy is generated ($S_{\\text{gen}}$). The Gouy-Stodola theorem proves that the lost opportunity to do work (Irreversibility $I$) is directly proportional to generated entropy: $I = T_0 \\cdot S_{\\text{gen}}$.',
    realWorldAnalogy:
      'Imagine transporting ice cream in a leaky cooler on a hot summer day. Every drop of ice cream that melts before you reach the party is lost forever. In thermodynamics, friction and thermal leaks destroy work potential.',
    keyTakeaway:
      'Lost Work = Ambient Temperature × Entropy Generated ($I = T_0 S_{\\text{gen}}$).',
  },

  // CHAPTER 7: GAS MIXTURES
  '7-1-mixture-composition': {
    everydayExampleTitle: 'Counting Atoms vs Weighing Gases',
    simpleExplanation:
      'When different gases share a container (like Nitrogen and Oxygen in the air we breathe), you can describe the mixture by molecule count (Mole fraction $y_i$) or by weight (Mass fraction $m_i$). Dalton’s Law says each gas exerts its own partial pressure as if it were alone in the entire tank.',
    realWorldAnalogy:
      'Think of a bowl filled with 80 blue marbles and 20 red marbles. The mole fraction of blue marbles is 80% (0.80). If you put a lid on top, the blue marbles bump against the walls causing 80% of the total impacts (Dalton Partial Pressure).',
    keyTakeaway:
      'Total Pressure = Sum of partial pressures ($P = P_{N_2} + P_{O_2} + \\dots$). Apparent Molecular Weight of air is ~28.97 kg/kmol.',
  },

  // CHAPTER 8: PURE SUBSTANCES & STEAM
  '8-1-phase-change-isobars': {
    everydayExampleTitle: 'Heating Water from Ice to Superheated Steam',
    simpleExplanation:
      'When you boil water at atmospheric pressure (1.013 bar), its temperature rises to 100°C. Then, temperature stays completely frozen at 100°C while water absorbs latent heat to turn into steam. Once every last drop of water evaporates (Dryness fraction $x = 1.0$), further heat raises the temperature into superheated steam.',
    realWorldAnalogy:
      'Cooking soup in a pressure cooker: By clamping the lid tight, steam builds up pressure (e.g. 2 bar). At higher pressure, water boils at a much hotter temperature (~120°C), cooking beans and potatoes in half the time!',
    keyTakeaway:
      'Under the dome: Wet mixture temperature stays constant at saturation ($T_{\\text{sat}}$) until all liquid turns to vapor.',
  },

  '8-2-steam-properties-mollier': {
    everydayExampleTitle: 'Steam Tables & The Mollier (h-s) Diagram',
    simpleExplanation:
      'Engineers use Steam Tables and Mollier diagrams ($h-s$) to instantly look up enthalpy (heat content) and entropy without solving complex calculus equations. On an $h-s$ diagram, the slope of a constant-pressure line equals the absolute temperature ($(\\partial h / \\partial s)_P = T$).',
    realWorldAnalogy:
      'Think of using Google Maps GPS instead of calculating your latitude and longitude with sextant trigonometry. Steam tables give you exact enthalpy and specific volume instantly for any boiler condition.',
    keyTakeaway:
      'Dryness fraction x = mass of vapor / total mass. If x = 0.9, the mixture is 90% steam vapor and 10% liquid water droplets.',
  },

  // CHAPTER 9: THERMODYNAMIC RELATIONS
  '9-1-maxwell-relations': {
    everydayExampleTitle: 'Maxwell Equations: Measuring the Unmeasurable',
    simpleExplanation:
      'Entropy ($S$) cannot be measured with a physical gauge in a factory. Maxwell’s Relations use calculus exact-differential properties to convert unmeasurable entropy derivatives into easy-to-measure changes in Pressure, Volume, and Temperature ($P, V, T$).',
    realWorldAnalogy:
      'Imagine trying to count the number of fish in a murky lake without draining it. If you know the water height rises by 1 mm for every 100 fish, you can measure the water height (easy) to find the fish population (hard). Maxwell relations do this for entropy!',
    keyTakeaway:
      'Maxwell relations link unmeasurable properties like $(\\partial S / \\partial P)_T$ directly to easily measurable lab properties like $-(\\partial V / \\partial T)_P$.',
  },

  '9-2-joule-thomson-relations': {
    everydayExampleTitle: 'Why Blowing with Pursed Lips Feels Cold (Joule-Thomson)',
    simpleExplanation:
      'When high-pressure gas forces its way through a narrow valve or restriction without doing external work (throttling), its enthalpy stays constant ($h_1 = h_2$). Below the inversion temperature, the gas cools down drastically upon expansion—this is how home air conditioners, refrigerators, and gas liquefiers work.',
    realWorldAnalogy:
      'Try this right now: Open your mouth wide and blow on your palm ("HAAAA")—the air feels warm. Now purse your lips into a tiny hole and blow fast ("WHOOO")—the air feels cool! Forcing air through a constriction drops its pressure and cools it down.',
    keyTakeaway:
      'Throttling is Isenthalpic ($h_1 = h_2$). If Joule-Thomson coefficient $\\mu_{JT} > 0$, throttling cools the fluid.',
  },
};

export const getIntuitiveData = (
  sectionId: string,
  chapterId?: number,
  sectionTitle?: string
): IntuitiveData => {
  if (intuitiveKnowledgeBase[sectionId]) {
    return intuitiveKnowledgeBase[sectionId];
  }

  // Fallback generator based on title and chapter
  return {
    everydayExampleTitle: sectionTitle ? `Understanding ${sectionTitle}` : 'Human Intuition & Plain English Concept',
    simpleExplanation:
      'In everyday terms, this thermodynamic principle describes how energy, heat, and matter interact without violating the conservation of energy or the natural increase of entropy in physical systems.',
    realWorldAnalogy:
      'Like everyday physical systems (water flowing downhill, bicycle pumps getting warm when compressed, or a refrigerator cooling food), this concept balances energy inputs against work output and natural dissipation.',
    keyTakeaway:
      'Every thermodynamic process must conserve total energy (1st Law) and generate positive or zero universe entropy (2nd Law).',
    commonMisconception:
      'Always remember to check whether a process is closed (mass trapped) or open (mass flowing), and keep temperatures in absolute Kelvin (K).',
  };
};
