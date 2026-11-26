/* ------------------------------------------------------------------
   Main Marks Development — per-client configuration.
   THE only file that should change between clients.

   Every figure below is quoted from a page of Main Marks' own material,
   named in `source`. Nothing here is invented. Where a value has not
   been supplied yet it is absent, and the screen shows one fact fewer.

   See BRANDING.md for where each colour and typeface came from.
   ------------------------------------------------------------------ */

const CONFIG = {

  /* Bumped on every deploy, and matched by the ?v= on every script tag in
     the HTML. That pair is what stops a returning phone running yesterday's
     JavaScript. See README, "Deploying". */
  build: 208,

  /* BUILD 171 (Muhanad, 17 Nov 2026: "finalize the sales view, remove anything that says this is a
     demo, for example the build number"). false = no demo marks on the screens a SALES AGENT sees:
     the build number is not shown (still set, so a check can read it; tap the MAIN MARKS signature at
     the foot of any page five times to show it), no demo-accounts list on the sign-in page, and "My
     activity" does not say "demo figures" / "in this demo". The manager view is not touched. true =
     the marks as before 171. */
  demoMarks: false,

  /* Where the activity log is sent. Empty = kept on the device only, which
     is where it is today. Filling this in is the whole change when the
     database is stood up. */
  activity: { url: '', key: '' },

  /* THE SALES AGENT'S DAY (build 134). Muhanad, 2026-10-07: an agent's daily duty is "at least 3
     offers" sent as a general broadcast to all the brokerage companies. My activity shows today's
     count against it, one line under his sales. Remove the number and the line goes. */
  salesDay: { broadcasts: 3 },

  /* THE SALES AGENT'S WEEK ("The week" card on Team Pulse). Muhanad, 2026-10-11: 10 orientations a
     week, one number for every sales agent; every visit counts. The week is Saturday to Thursday, so
     the week's broadcasts are salesDay.broadcasts times six. Remove the number and the card and its
     line on Home go. */
  salesWeek: { orientations: 10 },

  /* STORE:START */
  /* THE REAL STORE (build 122). The database where people sign in as themselves.
     `key` is the PUBLIC key: it is safe in a public file, because the database
     hands a stranger nothing (C:\Butterfly project\Main Marks Store, 03_security.sql).
     No other key ever goes here.
     BUILD 124: WHERE THIS BLOCK IS PRESENT, THE STORE IS THE APP. People sign in
     as themselves and there are no demo accounts. A copy published without this
     block (scripts/make-demo-publish.js cuts it unless told --store=real) is the
     demo: demo accounts, demo book. On this machine, login.html?store=demo
     switches one browser to the demo, and login.html?store=real switches it back. */
  store: {
    url: 'https://szoqzrnidwbqtwwvvxth.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b3F6cm5pZHdicXR3d3Z2eHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTA1NzcsImV4cCI6MjEwNjg4NjU3N30.WxAqHKE4FThEkwz3nI_8boKrSa3nW0UyB-91W_GzSKI',
    /* build 187: the PUBLIC key of the 'send later' buzz (js/buzz.js). Its private half is in the
       store's vault only (Main Marks Store, sql/11_buzz.sql). Safe in a public file. */
    buzzKey: 'BHN7TmZXmd9hafzfi2krSX0jxqssBnKOYnbzyDdeLJCSjIPXV902GSoui7hz1ibRmQ9rJJp4OI7I9Ux6r3R2qR0',
  },
  /* STORE:END */

  company: {
    name:    'MAIN MARKS',
    nameAr:  'مين ماركس',
    full:    'Main Marks Development',
    tagline: 'Bespoke Experiences',
    line:    'Main Marks unites Emirati precision and Egyptian heritage to create timeless destinations of luxury and value.',
    source:  'h:rs brochure p.4 (MAIN MARKS / BESPOKE EXPERIENCES)',
    wordmark: 'img/mainmarks-wordmark.svg'
  },

  /* --- Master brand palette -----------------------------------------
     Measured from mainmarks.com computed styles and from clean rendered
     areas of the brochure. Black and white carry 85-95% of any screen;
     orange is a signal, never a surface. ---------------------------- */
  brand: {
    ink:      '#000000',   /* corporate black: hero, header, footer     */
    deep:     '#001516',   /* the very dark corporate surface on the web */
    graphite: '#141414',   /* elevated dark panels                       */
    white:    '#FFFFFF',
    muted:    '#8B8989',   /* secondary copy. A tint between the CI's two greys (#565656, #C0BDBD, PDF p.25; tints allowed p.27). 5.3:1 on the cards — the CI asks for 4.5:1 (p.21); the old #74787C gave 4.1 */
    muted2:   '#807E7E',   /* tertiary labels, 4.6:1 on the cards (old #69727D: 3.8) */
    orange:   '#F7951E'    /* CTA text, underlines, active state, rails.
                              The Main Marks CI, PDF p.26 (Accent colours):
                              RGB 247 149 30. Was #F89621, measured off
                              the web before the CI arrived.            */
  },

  /* Manrope is named in BOTH brand books: the Main Marks secondary face
     (CI PDF p.30) and the Moray PRIMARY face (Moray CI PDF p.35). Neither book
     names Nexa, so it is no longer asked for. The Main Marks headline
     face is Gold Lines Serif (CI PDF p.29) — embedded in their own file as a
     TRIAL font, so it is not used here until they confirm a licence.
     Arabic, when it comes, is Noto Kufi Arabic (CI PDF p.31, Google Fonts). */
  type: {
    corporate: "'Manrope', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    project:   "'Manrope', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    utility:   "'Manrope', 'IBM Plex Sans Arabic', system-ui, sans-serif",   /* was Hanken Grotesk — not in the CI */
    substitute: true,
    real:      'Gold Lines Serif'
  },

  /* --- The projects --------------------------------------------------
     Main Marks names its projects "Marks of Distinction". Moray is the
     1st, h:rs is the 2nd. Moray is OPEN (ready:true) — the one
     project the contract buys; h:rs is out of scope and ready:false. A project with ready:false is shown and cannot be opened.
     Launching Moray is this flag plus its inventory. No code changes.
     The list sorts them by their Mark number — Moray, the 1st, first,
     as the one being built.                                           */
  projects: [
    {
      id:      'hrs',
      name:    'h:rs',
      short:   'h:rs',
      full:    'h:rs — Business Hub',
      mark:    '2nd Mark of Distinction',
      kind:    'Business hub · Mixed use',
      promise: 'Every Hour Counts',
      place:   'South 90 Street, New Cairo',
      /* build 155: Main Marks' own words for the card (their design notes, 11 Nov 2026) */
      blurb:   'h:rs Business Hub is an 11,000 SQM integrated destination on New Cairo’s South 90 Street, combining administrative, clinical, and commercial spaces around a contemporary, light-filled courtyard.',
      logo:    'img/hrs-logo.png',
      /* The night render off brochure p.26, pulled from the PDF as the
         FULL placed image (1385x1035) rather than the crop the page
         prints — the brochure frame cuts the tree and the road, and the
         app needs the whole picture to fill a plate. Extracted with
         `pdfimages -png -f 14`, encoded 4:4:4 so the illuminated h:rs
         signage stays crisp. See BRANDING.md. */
      /* build 155: "Please Use This New Render" (Main Marks' design notes, 11 Nov 2026): the day render they
         placed on the card, taken out of their file at its own 1455 x 822. The night one stays as render2's neighbour. */
      render:  'img/hrs-render-2026-11.jpg',
      renderNight: 'img/hrs-render-night.jpg',
      render2: 'img/hrs-render-sunset.jpg',
      render3: 'img/hrs-render-day.jpg',

      /* --- The mark, and where it is cut ------------------------------
         Tapping this project's card assembles its logo out of its own
         parts before the page opens. See "the mark builds itself" in
         brand.js and in styles.css.

         `src` is the logo Main Marks supplied
         (HRS-Logo-Exact-Transparent.png), cropped to the mark and
         otherwise untouched — verified pixel for pixel against the
         supplied file, so every fragment on screen is their own
         artwork and nothing has been traced or redrawn.

         `cut` is where the eight fragments are divided, as fractions
         of that file. These were MEASURED off its alpha channel, not
         estimated: xStem is the column where the h's stem ends and its
         shoulder begins, xRStem the same for the r, and so on. The
         eight rectangles they describe tile the whole file with no gap
         and no overlap — which is what guarantees that assembled they
         are the logo EXACTLY, and why no fragment can be a shape the
         logo does not contain.

         A project without this block simply opens the way any other
         link does. */
      markBuild: {
        src:   'img/hrs-mark-build.png',
        ratio: '2416 / 952',
        /* Main Marks' own pillar device, brochure p.18 ("Our Pillars"),
           cut out of that page one colour at a time and repainted in
           the palette below — the brochure is CMYK and prints the blue
           at #3858A8 against the #3B54A3 of the brand sheet. Rebuilt
           with scripts/cut-pillar-mark.js. Stacked, they are the
           artwork exactly. */
        pillars: {
          work:    'img/hrs-pillar-work.png',     /* blue,   first  */
          engage:  'img/hrs-pillar-engage.png',   /* yellow, second */
          connect: 'img/hrs-pillar-connect.png'   /* red,    third  */
        },
        cut: {
          xStem:      0.087334,   /* h: stem | shoulder                */
          xColon:     0.325952,   /* h | colon                         */
          xR:         0.478270,   /* colon | r                         */
          xRStem:     0.611755,   /* r: stem | shoulder                */
          xS:         0.748551,   /* r | s                             */
          yColon:     0.667542,   /* colon: upper square | lower square */
          yS:         0.633403    /* s: upper section | lower section  */
        }
      },
      /* The review model of the complex, turnable and tappable. Absent
         for a project that has none, and the link simply does not show. */
      model3d: 'model.html',

      masterplan: {
        img: 'img/hrs-masterplan.jpg',
        /* The five buildings the client's own masterplan prints, and
           where each one sits on it. Coordinates are FRACTIONS of the
           image (0-1), so they survive any resize, and they were traced
           on the drawing and checked by eye at every zoom.

           APPROXIMATE, and the app says so. Two reasons: this is a crop
           of a brochure page rather than the full-resolution master plan,
           and the render draws HB and HA as one continuous roof with no
           line between them — so the boundary between those two is
           placed midway between their printed labels. Main Marks' own
           master plan file replaces these, and the unit-level pins can
           only be traced on that file. */
        buildings: ['HA', 'HB', 'HC', 'HD', 'HE'],
        hotspots: [
          { id: 'HD', points: [[0.134, 0.212], [0.267, 0.212], [0.267, 0.792], [0.222, 0.840], [0.134, 0.840]] },
          { id: 'HC', points: [[0.328, 0.205], [0.482, 0.205], [0.482, 0.375], [0.455, 0.418], [0.328, 0.418]] },
          { id: 'HB', points: [[0.520, 0.205], [0.655, 0.205], [0.655, 0.425], [0.520, 0.425]] },
          /* HA's roof is cut by the diagonal walkway at its bottom-right,
             so it is a five-sided shape, not a box — checked by lighting
             every hotspot at once and looking at the drawing. */
          { id: 'HA', points: [[0.660, 0.205], [0.878, 0.213], [0.878, 0.295], [0.772, 0.423], [0.660, 0.425]] },
          { id: 'HE', points: [[0.302, 0.668], [0.332, 0.650], [0.880, 0.650], [0.880, 0.868], [0.302, 0.868]] }
        ],
        source: 'h:rs brochure p.31 (Master Plan & Floor Plans)',
        traced: 'approximate'
      },
      /* The floors the kit draws, in order. Each is a sheet, not yet a
         set of pinned units. */
      floors: [
        { id: 'street',  name: 'Street Level Floor', img: 'img/hrs-plan-street.jpg', legend: ['Retail', 'Pharmacy'], source: 'brochure p.32' },
        { id: 'ground',  name: 'Ground Floor',       img: 'img/hrs-plan-ground.jpg', legend: ['F&B', 'Showroom', 'Retail', 'Pharmacy'], source: 'brochure p.33' },
        { id: 'first',   name: 'First Floor',        img: null, legend: ['F&B', 'Showroom', 'Clinic', 'Admin'], source: 'brochure p.34' },
        { id: 'typical', name: 'Typical Floors',     img: null, legend: ['Clinic', 'Admin'], source: 'brochure p.35' }
      ],
      /* Straight from the brochure's Unit Types spread. Read at full
         resolution off p.36-37: the contact-sheet reading of the same
         page gave three different numbers, which is why the playbook
         says to judge a drawing only at full size. */
      kinds: [
        { id: 'admin',      name: 'Administrative', units: 317, from: 33, to: 222, colour: 'work',    pillar: 'Work' },
        { id: 'clinic',     name: 'Clinical',       units: 92,  from: 36, to: 224, colour: 'neutral', pillar: null },
        { id: 'commercial', name: 'Commercial',     units: 44,  from: 34, to: 719, colour: 'engage',  pillar: 'Engage' }
      ],
      kindsSource: 'h:rs brochure p.36-37 (Unit Types)',
      /* `v` is the figure as the brochure prints it, and stays that way
         — it is the quoted value and BRANDING.md cites it. `s` is the
         short form the project CARD shows: same number, without the
         feddan conversion and the percentage. Nothing is derived or
         invented here; one is simply a trim of the other. */
      facts: [
        { k: 'Land area',          v: '11,003 m² (2.62 feddan)',        s: '11,003 m²' },
        { k: 'Building footprint', v: '4,000 m² (0.95 feddan) — 36.4%', s: '4,000 m²' },
        { k: 'Landscape',          v: '7,003 m² (1.67 feddan) — 63.6%', s: '7,003 m²' },
        { k: 'Units',              v: '453 across three uses',          s: '453 across three uses' }
      ],
      factsSource: 'h:rs brochure p.26-27 (Land Use); unit total is the sum of p.36-37',
      /* The project's own colour system. Red/yellow/blue are the three
         pillars, and they CODE CONTENT — they are not decoration and they
         never carry body copy.
         OPEN with the client: the brochure gives no pillar colour for the
         clinical units. They are neutral here rather than given an
         invented fourth colour. */
      colour: {
        black:  '#000201',
        connect: '#ED1C24',   /* Connect  — community, movement        */
        engage:  '#F2E800',   /* Engage   — commercial, retail         */
        work:    '#3B54A3'    /* Work     — administrative, focus      */
      },
      pillars: [
        { id: 'connect', name: 'Connect', line: 'Community, meetings and the retail streets between the buildings.' },
        { id: 'engage',  name: 'Engage',  line: 'The commercial and retail experience: cafés, stores and daily services.' },
        { id: 'work',    name: 'Work',    line: 'The administrative core — offices built for focus and efficiency.' }
      ],
      pillarsSource: 'h:rs brochure p.18-21 (Our Pillars / Connect / Engage / Work)',

      /* --- Inventory -------------------------------------------------
         A DEMO book today. Real counts and real size ranges from the
         brochure; every price, discount and status invented. See
         scripts/make-demo-inventory.js.

         Swapping to Main Marks' own sheet is THIS BLOCK and nothing
         else: point `url` at
           https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv
         and set demo:false. The reader validates the header row and
         refuses anything that is not the inventory. */
      inventory: {
        url: 'demo/hrs-inventory-DEMO.csv',
        demo: true,
        demoNote: 'Every price, discount and availability here is invented, so the app can be used before Main Marks sends the real sheet. The unit counts and size ranges are the brochure’s own.'
      },

      /* --- Payment plans ---------------------------------------------
         DEMO. Main Marks has not sent theirs. The shape is what their
         answers drop into: down payment, term, frequency, milestones.
         The ENGINE (js/plans.js) is not demo — it derives and foots. */
      plansDemo: true,
      plans: [
        { id: 'p10', label: '10% down · 5 years', down: 0.10, years: 5, every: 3 },
        { id: 'p15', label: '15% down · 7 years', down: 0.15, years: 7, every: 3 },
        { id: 'p20', label: '20% down · 8 years', down: 0.20, years: 8, every: 3 }
      ],
      terms: {
        instalmentEvery: 3,          /* months between instalments        */
        downOn: 'discounted',        /* the down payment is a share of the
                                        DISCOUNTED price. Clients answer
                                        this both ways — Main Marks has
                                        not answered it yet.             */
        deliveryMonths: 36,
        maintenance: { pct: 0.08, on: 'list', dueMonthsBeforeDelivery: 6, label: 'Maintenance deposit' },
        extras: []                   /* nothing supplied; nothing shown   */
      },

      brokerages: [],       /* the companies list       -> activity capture */

      /* OUT OF SCOPE since 2026-09-24: the contract buys ONE project and
         it is Moray. h:rs is shown as Coming soon and cannot be opened.
         Everything above is kept, not deleted — it is a sold extra
         project away from coming back, and flipping this is the whole
         change. */
      ready: false
    },
    {
      id:      'moray',
      name:    'Moray',
      short:   'Moray',
      full:    'Moray',
      mark:    '1st Mark of Distinction',
      kind:    'Mixed use',
      /* Every line below is the Moray brochure (Digital Brochure, 58 pp —
         the same file as Moray-Brochure.pdf). Its printed folio runs ONE
         BEHIND the PDF page; pages here are PDF pages. */
      promise: 'The new mark of the city',          /* PDF p.58          */
      /* build 155: the line under MORAY on the projects page's card (Main Marks' design notes, 11 Nov 2026) */
      cardLine: '1st Mark of Distinction',
      place:   'North 90th Street, New Cairo',      /* PDF p.10, p.14    */
      blurb:   'Fourteen buildings of offices, clinics and serviced apartments, over street-level retail.',  /* PDF p.14 */
      /* The render off the Moray deck, printed page 11 — the whole placed
         image (1890x1204), copied out of the PDF as its own JPEG with no
         re-encoding. Watch the page numbering: the deck's printed folio
         runs one BEHIND the PDF page, so printed 11 is PDF page 12.

         It is a CONCEPT image from an ARC 5 design deck, not a verified
         approved visual — same caveat as the h:rs renders. See
         BRANDING.md. */
      /* build 155: "Use The New Render" on the projects page's card (Main Marks' design notes, 11 Nov 2026):
         the day render of the North 90 front they placed there, out of their file at its own 1455 x 782.
         The old one (img/moray-render.jpg) is kept for what still names it. */
      render:  'img/moray-render-day.jpg',
      renderSource: 'Main Marks, sales app design notes, 11 Nov 2026 (projects page)',

      /* THE AERIAL, on the product-line chooser (build 39, Muhanad's
         request). A night aerial of the whole complex with the lights
         off; hovering a line's card fades in the SAME picture with that
         line's buildings lit, so the salesperson sees where it is.

         BUILD 158: the picture is MAIN MARKS' OWN RENDER (MORAY-CAM-DAY-01,
         a day render, sent 14 Nov 2026; their note: "use the new render and
         turn off the other lights except the project"). Nothing in it is
         drawn or generated: scripts/make-night-aerial.js grades their pixels
         to night and adds the light where a line's floors are, from the 14
         traced roofs. All six are 1672 x 941, the same pixels outside the
         light, so the fade moves nothing else. WebP q86.

         BUILD 159 (Muhanad, 15 Nov 2026: "enhance the image quality and the
         accuracy of the light specially in the commercial ... night mood but
         not that much black and white ... cinematic ... show the cars lights"):
         the same render and the same script, re-lit. Still their pixels, no
         AI. The night keeps its colour (blue shadows, a day-for-night grade);
         every car has head and tail lights and throws its beam on the road
         (scripts/night-aerial/cars.json, 84 cars, each facing the way the
         render drew it); the MORAY billboard, the median panels and lamps
         are lit; the Commercial light sits on the TRACED shop fronts
         (scripts/night-aerial/shops.json) and falls on the terraces, with
         the plaza pool and the roof seating decks; the other four lines keep
         their floors, with warmer, softer windows. Nothing outside the
         project is lit except the road. WebP q85, about 420 KB each. NEW FILE
         NAMES (moray-night-159*.webp) so no phone shows a kept copy of the
         158 pictures; those are in tools/old-aerial-158/, not published.

         BUILD 160 (Muhanad, 16 Nov 2026, on his phone: the middle building lit
         on Offices; the light running out of the buildings on every card; not
         realistic, it must come from inside; the picture a cut-out on the
         page; 4K): 3840 x 2161. C1 is no office building (its admin is off,
         here and in scripts/night-aerial/buildings.json). The front blocks
         and both Wellness blocks are lit only inside their TRACED glass
         (scripts/night-aerial/facades.json), with no glow spread round them;
         a lit floor is brightest under its ceiling, dark at its slabs, each
         bay its own warmth, the mullions and white fins in front of the glass
         dark. The picture's edges melt into the page's black (look.json
         fade). WebP q80, about 1 MB each; the 159 pictures are in
         tools/old-aerial-159/. The roofs and light boxes stay in 1672 x 941
         (the frame); the picture has the same proportions, so they scale.

         BUILD 161 (Muhanad, 16 Nov 2026, "make a final check": the shipped
         160 pictures were cut into full-size tiles and each card's light
         looked at on the day picture). Found and corrected: the east face of
         D1-D2 and two shop fronts were drawn one storey too low, so the
         plaza floor and its tables were lit; B2, D3-D4, E2 and the four R
         Residence blocks were still lit by roof-and-height geometry, so
         light sat on roof railings and on a building behind; the bronze roof
         railings lit as seating decks. Now EVERY lit face of every building
         is traced (facades.json), parapets, slabs, awnings and teal ribbons
         in front of the glass stay dark, rooms have walls between them and a
         few are dark, and the lit room shows what the render shows through
         the glass. WebP q84, about 1.25 MB each; the 160 pictures are in
         tools/old-aerial-160/.

         BUILD 162 (Muhanad, 16 Nov 2026: "in the commercial card i want the
         top of all the buildings to light up, and in the R residence the top
         of the buildings that contain the R residence"): the ROOFS light.
         Commercial = the roof of every building, R Residence = the roofs of
         its four blocks: warm lamps standing on the terrace, each a pool of
         light on the roof's own paving, pergolas and furniture, fading out
         before the roof's edge so nothing falls on a facade (look.json roof).
         Only those two pictures changed (moray-night-162-commercial / -residence);
         the other four keep their 161 names. 161's two are in tools/old-aerial-161/.

         BUILD 163 (Muhanad, 16 Nov 2026: "Fix the light in the fourth card and
         the medical card should have the top of the buildings light up as
         well. do only those"). The Fourth: on the front blocks the fourth
         floor is an OPEN TERRACE set back under the roof (tables, people, a
         glass wall behind); lit as glass it was a thin blotched strip, now
         it is lit as a terrace (facades.json terrace, look.json terrace).
         Clinics: the roofs of its two blocks light, as on Commercial. Only
         moray-night-163-fourth and -163-wellness are new.
         The pictures of builds 39 to 157 (Muhanad's, made in Codex) are kept
         in tools/old-aerial-codex/ and are not published.

         Which buildings: the brochure's first-floor plan (PDF p.20) marks
         the two Clinics blocks — the top-left and right blocks — and those
         are exactly the two the Wellness image lights. A line with no
         `lit` image simply does not light; nothing is drawn in its place. */
      /* BUILD 169 (Muhanad, 17 Nov 2026: "add the pool that has the figure to light up"): on Commercial the plaza
         pool is lit from below in its own blue, the sculpture's orange core glows and its stone is caught warm from
         below (commercial-fix.js step 3). By code: no new AI picture.
      /* BUILD 168 (Muhanad, 17 Nov 2026: "lower the temp a little bit ... and maybe we can have the landscape light
         up"): Commercial's light white-balanced from the AI's orange (r:g:b 1.85:1:0.45) to 1.45:1:0.62, near the
         other cards; the plaza's own trees and planting beds lit by garden lights (uplit, in the leaves' own colour,
         inside the plaza's kerb wall only); a magenta dot the AI copied from the guide removed
         (scripts/night-aerial/commercial-fix.js). By code: no new AI picture.
      /* BUILD 167 (Muhanad, 17 Nov 2026: "this is how we want the light up to look ... nothing in the original render
         should change, just the light up for every card"): the Offices, The Fourth and Commercial pictures are
         AI-lit (Higgsfield, Nano Banana 2.1, his account, his yes to the upload; prompts and raw results in
         Desktop/Moray - Main Marks/AI night pictures). Only the LIGHT is taken from the AI picture: aligned to this
         frame (x1.433), kept only where it is brighter than the night picture and only inside that card's buildings
         (scripts/night-aerial/composite.js), so every other pixel is the night picture's own and C1, the building
         behind it and the billboard stay as they were. Clinics and R- Residence are still lit by code (credits ran out). */
      /* BUILD 165: allLit = every building lit (all floors, shops, roofs; scripts/make-night-aerial.js line `all`).
         A line page opens dark and lights ONLY the building chosen, cut out of this picture by its outline. */
      aerial: { img: 'img/moray-night-161.webp', allLit: 'img/moray-night-165-all.webp',
                source: 'Main Marks render MORAY-CAM-DAY-01 (sent 14 Nov 2026), turned to night by scripts/make-night-aerial.js' },

      /* The wordmark is lifted as vector outlines off the Moray CI, p.18
         (Brand logo) — scripts/extract-ci-logo.js, nothing redrawn. */
      logo:    'img/moray-logo.svg',

      /* --- The mark builds itself, Moray's way ------------------------
         Tapping the card plays the entry transition in js/markbuild.js
         ("letters"). Its pieces are the five LETTERS of this file — each
         one is its own vector path in the CI's outlines, so every moving
         shape is literally one letter of the logo and nothing is drawn.
         The lockup under it is the brochure's own, PDF p.9: an orange
         slash, "1st MARK OF", a white rule, "DISTINCTION".

         There is no Moray animation to measure (h:rs had its website
         MP4), so the timing mirrors the h:rs one and the order is the
         logo's reading order. Replace it if Main Marks sends one. */
      markBuild: {
        kind:    'letters',
        src:     'img/moray-logo.svg',
        tagline: ['1st Mark of', 'Distinction'],     /* brochure PDF p.9 */
        source:  'Moray CI PDF p.18 (logo); Moray brochure PDF p.9 (lockup)'
      },

      /* Moray's own palette, Moray CI p.31-33. The band takes `black`,
         which is Moray's CHARCOAL ground, not pure black. Orange and blue
         are kept for when the project is built; nothing uses them yet.
         The CI's printed labels on p.32-33 are copy-paste errors (the red
         swatch is captioned 192,189,189), so these were sampled off the
         swatches themselves. */
      colour: {
        black:  '#323031',   /* the ground, RGB 50 48 49                 */
        ink:    '#191819',
        orange: '#FA6126',   /* primary                                  */
        blue:   '#12A2C6'    /* primary; tints #15BEE8 #095569 #06333E    */
      },
      /* Quoted, PDF p.14. "Approximately 17 feddans equivalent to 70,000
         SQM" is printed as is — 17 feddans is nearer 71,400 m², so the
         brochure's own two numbers are both shown and neither is ours. */
      facts: [
        { k: 'Land area',  v: 'About 17 feddans (70,000 m²)', s: '70,000 m²' },
        { k: 'Buildings',  v: '14 — 8 administrative, 2 clinical, 4 serviced apartments', s: '14 buildings' },
        { k: 'Entrances',  v: '10, three of them grand gates on North 90th Street', s: '10' },
        { k: 'Unit sizes', v: '38 – 2,444 m² across four uses', s: '38 – 2,444 m²' }
      ],
      factsSource: 'Moray brochure, PDF p.14; unit sizes span the four ranges on p.28, 35, 37 and 40',

      /* Sizes only. The brochure gives NO unit counts, so none are shown
         and none are guessed; the card and page print the range alone.
         Neutral marks: Moray's CI does not colour-code its uses. */
      kinds: [
        { id: 'commercial', name: 'Commercial',          from: 43, to: 2444, colour: 'neutral' },  /* PDF p.28 */
        { id: 'admin',      name: 'Administrative',      from: 42, to: 1410, colour: 'neutral' },  /* PDF p.35 */
        { id: 'clinic',     name: 'Clinical',            from: 41, to: 203,  colour: 'neutral' },  /* PDF p.37 */
        { id: 'serviced',   name: 'Serviced apartments', from: 38, to: 83,   colour: 'neutral' }   /* PDF p.40 */
      ],
      kindsSource: 'Moray brochure, PDF p.28, 35, 37, 40',

      /* --- What is being sold: Moray's product lines ----------------------
         Moray is sold as FOUR products, and three of them carry their own
         brand. Opening Moray shows one card per line; the card is the way
         in and the first filter. Each is dressed in ITS OWN identity, from
         its own brand book, never in another line's:

           admin      no brand of its own — Moray's charcoal ground, Moray's
                      wordmark, and the brochure's own section heading
                      ("/ ADMINISTRATIVE SPACES", PDF p.35) under it
           fourth     The Fourth CI's MASTER VISUAL, PDF p.20: the campaign
                      photograph with the white EXTENDED LOCKUP across its
                      foot ("BEYOND THE THIRD / INTO ——— THE FOURTH / LEVEL OF
                      BUSINESS"), cut as vector by scripts/cut-fourth-lockup.js.
                      The card uses a shorter line (the CI allows it, p.19)
           wellness   Moray Wellness CI's BRANDED TEMPLATE, PDF p.10: "renders
                      must always be presented within the approved branded
                      template" (p.14) — orange bar left, blue bars right,
                      the WHITE logo top centre (white on dark, p.11), BY/
                      MAIN MARKS and 1ST MARK / NEW CAIRO at the foot. The
                      render is the one the CI's own template uses.
           residence  NO brand book received. Set as the brochure's own
                      lockup, PDF p.39 — "R- RESIDENCE by" over the Moray
                      wordmark, with the slash — on Moray's ink ground.
                      Replace it with their logo file when it arrives.

         Commercial was held back on 2026-09-29 and RELEASED on 2026-10-05
         (build 100): Main Marks' sheet sells ten street-level units.

         `accent` colours the way-in line and the ring on the card. It is
         each line's own accent, from its own CI, never borrowed.

         Every figure is quoted, with its page. The admin size range is
         Moray's brochure (Oct 2025), which predates The Fourth (Sep 2026)
         — whether it includes the fourth floor is not stated. */
      lines: [
        /* THE ORDER OF THE CARDS (Muhanad, 2026-10-05, "the design point of view"): from the ground up.
           Swiping lights the complex in the order it is built: the ground floor everywhere (Commercial),
           the middle floors (Offices), the top floor (The Fourth), then the two clinic buildings and the
           back row. It is also the brochure's order. Sales would put Offices first (most units); he chose
           the story. demo.html swipes the cards in this order. */
        { id: 'commercial', released: true,
          name:   'Commercial units',
          badge:  'Shops',
          ground: '#323031', ink: '#FFFFFF', accent: '#FA6126',   /* Moray's own ground and primary orange: commercial has no brand of its own, so it wears Moray, as the offices do */
          mark:   { kind: 'moray-heading', logo: 'img/moray-logo.svg', heading: 'Commercial units' },
          img:    'img/moray-line-commercial.jpg', imgSource: 'Moray brochure, PDF p.29',
          line:   'A lively, walkable hub of shops, cafés and dining.',   lineSource: 'Moray brochure, PDF p.28',
          facts:  [ { k: 'Unit sizes', v: '43 – 2,444 m²' }, { k: 'Where', v: 'Street level and ground floor' } ],
          factsSource: 'Moray brochure, PDF p.18, 19, 28',
          lit:    'img/moray-night-205-commercial.webp', /* build 205 (Muhanad, 26 Nov: "building E1 is not perfect so fix it"): E1's whole shop front lit, not thin lines; composite.js SHOPS=20 adds the traced shop fronts (shops.json) to where light may come from, since E1's building shape stops above its shop glass; same settings otherwise. build 204 (Muhanad, 26 Nov 2026): ONLY the ground floors lit, every building where any ground floor shows (E2 from its right side); the light taken from his Nano Banana picture (Downloads Gemini_Generated_Image_a2ycpga2ycpga2yc.jpg) onto moray-night-161 by scripts/night-aerial/composite.js (k 0.3582, ox 0, oy -4; DETAIL=3 SOFT=3 DENSE=10 WARM=0.008 DMIN=0.006 GROW=24, all 14 ids): its warm light, our render's detail, the billboard and every typical floor untouched; roofs no longer lit. Before: build 170: back to the 168 picture (his choice, 17 Nov 2026: the 169 pool and paving glow were too much; trees softly lit, pool dark). build 159: the traced shop fronts of the five front buildings and the light they throw on the terraces, the plaza pool, the roof seating decks */
          floors: ['street', 'ground'],          /* Retail, Bank, Pharmacy / F&B, Retail, Showroom, Pharmacy in their legends, PDF p.18-19 */

          /* --- the line page: the same flow + Find a unit as every line (build 100).
             RELEASED 2026-10-05 on Muhanad's word, because Main Marks' own sheet sells it:
             10 rows, Type "Commercial", Bldg "ST", Floor "S.Level". All 10 codes and sizes
             were read against the brochure's street-level plan (PDF p.18) and agree
             (the sheet writes "ST03E-2" where the plan prints "ST03 (E2)").
             WHERE THEY ARE: the sheet's building is "ST" = the street level, not a block.
             It is shown under that name. A ground-floor shop added with Bldg "A" shows as
             Building A by itself. Nothing is traced: no roofs, no cuts, so units are picked
             from the list and the line's lit picture stays on.
             PLANS: every current plan since build 152 (Muhanad, 2026-11-05: cash "on all units",
             then "Yes, all plans" for the discounted instalment plans). The October offer never
             applied to Commercial (Yostina, 29 Sep 2026); its plans carry that rule (`notFor`). */
          layout: 'plan',
          match:  { type: ['Commercial'] },
          /* FIND A UNIT, FOR THIS PRODUCT (build 112). Laid out from the finished project, not from today's sheet:
             the brochure's three shop levels (street PDF p.18, ground p.19, first-floor showrooms p.20), its five
             tenant kinds (the plans' own legends) and its size range (43 to 2,444 m2, p.28).
             WHICH KIND A SHOP IS: a "Use" column in the sheet wins; without one, the street level is read off the
             p.18 colours (bank ST03D, ST09, ST10, ST14; pharmacy ST04A; every other ST shop retail) and every
             first-floor shop is a showroom (p.20 has no other commercial colour). THE GROUND FLOOR (about 200
             shops: F&B, retail, showroom, pharmacy) IS NOT TABLED YET: until Main Marks' sheet carries the kind,
             a ground-floor shop is listed but answers no Tenant chip. */
          filters: {
            floors: ['street', 'ground', 'first'],
            sizes: [
              { id: 'c100', label: 'Up to 100 m²', lo: 0, hi: 100 },
              { id: 'c200', label: '101–200 m²', lo: 100, hi: 200 },
              { id: 'c500', label: '201–500 m²', lo: 200, hi: 500 },
              { id: 'c1000', label: '501–1,000 m²', lo: 500, hi: 1000 },
              { id: 'cmax', label: 'Over 1,000 m²', lo: 1000, hi: Infinity }
            ],
            facets: [
              { id: 'use', label: 'Tenant', column: 'kind',
                options: [
                  { id: 'retail',   label: 'Retail',   words: ['retail', 'shop'] },
                  { id: 'fnb',      label: 'F&B',      words: ['f&b', 'f & b', 'food', 'restaurant', 'cafe', 'café'] },
                  { id: 'showroom', label: 'Showroom', words: ['showroom', 'show room'] },
                  { id: 'pharmacy', label: 'Pharmacy', words: ['pharmacy'] },
                  { id: 'bank',     label: 'Bank',     words: ['bank'] }
                ],
                rules: [
                  { is: 'bank',     floors: ['street'], codes: ['ST03D', 'ST09', 'ST10', 'ST14'] },
                  { is: 'pharmacy', floors: ['street'], codes: ['ST04A'] },
                  { is: 'retail',   floors: ['street'], starts: ['ST'] },
                  { is: 'showroom', floors: ['first'] }
                ] }
            ]
          },
          floorsByBuilding: true,
          roofs:  'all',                          /* in the buildings (ground floor and up): any of the 14 may hold shops */
          stepFloors: ['street', 'ground'],       /* build 111: every building shows both cards; the ground floor says "none available" until its shops are in the sheet */
          /* BUILD 155 (Main Marks Development, 11 Nov 2026: "Make the street-level units a separate building in
             the application, as shown in the inventory sheet, so users can select it from the building list"):
             every shop the sheet files under "ST" is listed under Street level again. Each still stands in
             the block above it (`street` in the project's buildings): that roof lights, its offer draws that
             block, and its delivery date is that block's (js/lineflow.js homeKey, docOf). */
          /* BUILD 183 (Muhanad, 18 Nov 2026, Main Marks' request: "if he selected street level, then he should not be
             seeing the buildings. He should see the street level full master plan"; he chose "option B with Way 2",
             the tabs named "Street level" and "Ground floor"): step 1 carries two tabs. STREET LEVEL shows the whole
             street-level plan (config floors `street`) with one ZONE per block of shops (`zones` below, keyed by the
             project building the shops stand under); a lit zone holds shops for sale; a tap lifts that block's cut
             (`plates`) and lists its shops. GROUND FLOOR is the aerial and its buildings, as every other line.
             Until 182 the street level was one pretend building, "ST" (`buildings: [{ id: 'ST', name: 'Street
             level', inventory: 'ST' }]`, build 155); with no line building, each shop is filed under its block again
             (js/lineflow.js build, homeKey) and its offer still names that block. */
          streetTabs: true,
          /* BUILD 206 (Muhanad, 26 Nov 2026: "when the user select the building the way the layout inside the card light up should be
             exactly like how it is outside"). On the Ground floor tab a chosen building lights EXACTLY as on the Moray page: this
             line's lit picture through that building's own light mask (litMask + id + .png, white where its light was put, made
             with the picture by scripts/night-aerial/composite.js MASKS=...), and no roof light (litTop: false). A building's
             traced outline stops above its shop glass and takes in a neighbour's shops, so an outline cut could not match. A
             building with no mask has no light outside, and none inside. RE-MAKE THE MASKS WITH EVERY NEW lit PICTURE. */
          litTop: false,
          litMask: 'img/moray-litmask-206-',
          litMaskIds: ['A1', 'B1', 'C1', 'D1-D2', 'D3-D4', 'E1', 'E2'],
          /* the zones on the street-level plan, in its frame (1445 x 1332). HA, A2, A1, C2, C1 and HD TRACED BY
             MUHANAD in tools/trace-street-zones.html (scripts/make-street-zone-tracer.js), 18 Nov 2026 (build 184).
             HB and HC are STILL THE SEED BOXES round ST02B / ST02A (he will trace them later); neither holds a shop
             in the sheet today, so both show only as a faint dashed outline. */
          zones: {
            'HA': [[267, 108], [76, 124], [72, 126], [67, 128], [63, 129], [59, 131], [55, 133], [52, 136], [48, 138], [45, 141], [42, 144], [39, 147], [36, 150], [33, 153], [31, 157], [29, 161], [27, 165], [25, 169], [23, 173], [21, 177], [20, 182], [19, 187], [18, 192], [17, 197], [16, 202], [16, 207], [15, 212], [14, 218], [13, 223], [13, 228], [12, 233], [12, 238], [11, 243], [11, 249], [10, 254], [10, 259], [9, 264], [9, 269], [9, 274], [8, 280], [8, 285], [8, 290], [8, 295], [8, 300], [8, 305], [7, 310], [7, 316], [9, 319], [10, 323], [13, 325], [16, 327], [19, 328], [23, 329], [28, 329], [357, 328], [359, 328], [361, 327], [362, 324], [363, 320], [362, 315], [336, 138], [336, 135], [335, 133], [333, 131], [330, 129]],
            'HB': [[358, 40], [660, 40], [660, 322], [358, 322]],      /* seed box: not traced yet */
            'HC': [[662, 40], [935, 40], [935, 245], [662, 245]],      /* seed box: not traced yet */
            'HD': [[966, 234], [1073, 218], [1301, 217], [1301, 140], [1301, 133], [1300, 127], [1299, 122], [1299, 116], [1298, 111], [1297, 106], [1297, 102], [1296, 97], [1296, 93], [1285, 56], [1263, 34], [1240, 24], [1214, 20], [1196, 19], [1142, 19], [1059, 20], [1020, 20], [1007, 34], [938, 45]],
            'A2': [[35, 365], [156, 365], [159, 366], [161, 368], [162, 371], [163, 616], [162, 618], [160, 620], [158, 620], [33, 620], [29, 620], [26, 619], [24, 617], [22, 615], [20, 612], [19, 608], [20, 376], [22, 372], [24, 369], [27, 367], [31, 365]],
            'A1': [[33, 655], [159, 655], [161, 656], [162, 658], [163, 661], [163, 999], [162, 1002], [160, 1004], [157, 1005], [76, 1005], [74, 1005], [72, 1007], [72, 1009], [72, 1012], [71, 1081], [64, 1088], [17, 1088], [18, 670], [19, 665], [22, 661], [25, 658], [28, 656]],
            'C2': [[595, 497], [595, 495], [595, 493], [597, 491], [723, 473], [728, 473], [732, 474], [735, 476], [737, 479], [737, 483], [736, 673], [597, 675], [597, 647], [595, 642]],
            'C1': [[737, 689], [737, 934], [737, 937], [735, 939], [731, 939], [665, 939], [663, 938], [662, 935], [662, 930], [662, 908], [662, 904], [662, 900], [661, 896], [660, 894], [605, 853], [602, 849], [599, 845], [598, 841], [596, 722]]
          },
          place:  'North 90th Street, New Cairo',
          /* Tapping the card builds the mark it wears, as Offices does: MORAY rises, then
             the slash and the brochure's own words for this product (PDF p.28). */
          /* BUILD 155, THE CARD ON THE MORAY PAGE (Main Marks' design notes, 11 Nov 2026: "Please use every section with its identity"): their picture on top, then a band in the line's colour carrying the MORAY wordmark (or the line's own logo) with the line's name centred under it. The colours are SAMPLED off their mock until the line's brand book file is with us. js/project.js lineCard. */
          /* build 156: the colours are the brand book's own (Moray Commercial Guidelines p.19: #7C1823, #FEA177,
             #F7F0E6), no longer sampled; "Same place / One Address" is their lockup in the Amsterdam script,
             lifted as drawn from p.12 (img/moray-commercial-one-address.svg); the card shows only the unit sizes
             (their mock, sales app.pdf p.3); the line page keeps every fact. */
          card:   { photo: 'img/moray-card-commercial.jpg', ground: '#7C1823', ink: '#FFFFFF', accent: '#FEA177', bars: { left: '#FEA177', right: '#F7F0E6' },
                    script: 'img/moray-commercial-one-address.svg', facts: ['Unit sizes'],
                    logo: 'img/moray-logo.svg', sub: 'Commercial units',
                    photoSource: 'Main Marks, sales app footage, 11 Nov 2026 (Asset 1@4x.png); lockup: Moray Commercial Guidelines p.12' },
          /* build 193 (Muhanad, 24 Nov 2026: "the transition ... should be the logo of that type and make it
             simple ... high quality as in the CI of that type"): Commercial has no logo of its own; its CI
             (Moray Commercial Guidelines) signs with MORAY and the "Same place / One Address" script, so
             those two vectors come up, simply (js/markbuild.js runLogo). Until 192: kind 'letters', heading
             'Commercial units' (the MORAY letters rising). */
          /* build 194 (Muhanad, 24 Nov 2026): "the transition of moray commercial card should be without the
             slogan make it as it was before": the "Same place / One Address" script is gone; MORAY alone with
             COMMERCIAL UNITS under it, as before 193 (extra: 'img/moray-commercial-one-address.svg' in 193). */
          markBuild: {
            kind:    'logo',
            src:     'img/moray-logo.svg',
            width:   0.6,
            sub:     'Commercial units',          /* build 155: under the logo, centred (their notes) */
            source:  'Moray CI PDF p.18 (logo)'
          }
        },
        { id: 'admin', released: true,
          name:   'Administrative units',
          badge:  'Offices',
          ground: '#323031', ink: '#FFFFFF', accent: '#FA6126',   /* Moray's own ground and its primary orange — Moray CI; admin IS Moray, so it wears Moray */
          mark:   { kind: 'moray-heading', logo: 'img/moray-logo.svg', heading: 'Administrative spaces' },
          img:    'img/moray-line-admin.jpg',   imgSource: 'Moray brochure, PDF p.36',
          line:   'From agile studios to corporate headquarters.',   lineSource: 'Moray brochure, PDF p.35',
          facts:  [ { k: 'Unit sizes', v: '42 – 1,410 m²' }, { k: 'Buildings', v: '8 administrative' } ],
          factsSource: 'Moray brochure, PDF p.14, 35',
          lit:    'img/moray-night-167-admin.webp',      /* first to third floors of the office blocks, clinics left dark */
          floors: ['first', 'second', 'third'],  /* "Admin" in their legends, PDF p.20-22 */

          /* --- the line page: the same Qomor flow + Find a unit as Moray
             Wellness (build 70). js/lineflow.js. ---------------------------
             WHICH ROWS: Type "Admin" on the 1st to 3rd floors. Admin on the
             Fourth is The Fourth, its own line. No building is traced yet,
             so buildings come from the sheet (B, D1-D4) and are chosen from
             the select; the line's lit picture stays on. */
          layout: 'plan',
          match:  { type: ['Admin'], floors: ['first', 'second', 'third'] },
          /* FIND A UNIT, FOR THIS PRODUCT (build 112): from the finished project, not today's sheet. Offices on the 1st to 3rd floors, 42 to 1,410 m2, "compact studios to large headquarters" (Moray brochure PDF p.35). */
          filters: {
            floors: ['first', 'second', 'third'],
            sizes: [
              { id: 'o60', label: 'Up to 60 m²', lo: 0, hi: 60 },
              { id: 'o100', label: '61–100 m²', lo: 60, hi: 100 },
              { id: 'o200', label: '101–200 m²', lo: 100, hi: 200 },
              { id: 'o500', label: '201–500 m²', lo: 200, hi: 500 },
              { id: 'omax', label: 'Over 500 m²', lo: 500, hi: Infinity }
            ]
          },
          stepFloors: ['first', 'second', 'third'],
          place:  'North 90th Street, New Cairo',
          /* Tapping the card builds the mark it wears: MORAY rises letter by
             letter (Moray's own entry), then the brochure's section heading
             arrives under it — the orange slash draws up and "ADMINISTRATIVE
             SPACES" comes in (Moray brochure PDF p.35). */
          /* BUILD 155, THE CARD ON THE MORAY PAGE (Main Marks' design notes, 11 Nov 2026: "Please use every section with its identity"): their picture on top, then a band in the line's colour carrying the MORAY wordmark (or the line's own logo) with the line's name centred under it. The colours are SAMPLED off their mock until the line's brand book file is with us. js/project.js lineCard. */
          /* build 157: THEIR PICTURE (a man on the phone in an office at sunset) is cut from their mock, the
             only file that holds it (sales app.pdf p.4, its 454 x 443 px as placed there), with the mock's thin
             orange strip at its left (2.9% of the card). A larger file from them replaces it as is. */
          card:   { photo: 'img/moray-card-admin.jpg', ground: '#FF8F00', ink: '#000000', accent: '#FF8F00',
                    bars: { left: '#FF8F00' }, barWidth: { left: '2.9%' }, coverBars: {},   /* the offer's cover stays as in 156: no bar */
                    logo: 'img/moray-logo.svg', logoInk: 'black', sub: 'Administrative units', photoSource: 'Main Marks, sales app.pdf p.4 (their mock)',
                    facts: ['Unit sizes'] },   /* build 193 (Muhanad, 24 Nov 2026): the card carries only the sizes, as Commercial */
          /* build 193: the line's logo, simply (js/markbuild.js runLogo). Offices has no brand of its own:
             it wears MORAY (Moray CI p.18). Until 192: kind 'letters', heading 'Administrative spaces'. */
          markBuild: {
            kind:    'logo',
            src:     'img/moray-logo.svg',
            width:   0.6,
            sub:     'Administrative units',      /* build 155: under the logo, centred (their notes) */
            source:  'Moray CI PDF p.18 (logo)'
          }
        },
        { id: 'fourth', released: true,
          name:   'The Fourth',
          badge:  'Fourth floor',
          ground: '#090909', ink: '#F4F4F1', accent: '#F4F4F1',   /* void black, paper white — CI PDF p.21. The accent is the paper white: void black is invisible on the app's dark card */
          /* Two compositions, each where the CI puts it:
               card (near-square)  the CI's p.30 post, "centered
                   placement": the primary logo 88.5% wide, its line run
                   to the edges and ended in the red squares, the photo
                   under a 33% black layer (as the CI file draws it), BY/
                   MAIN MARKS MORAY and 1ST MARK / NEW CAIRO at the foot.
                   p.31: never the statement + logo as one crowded lockup
                   on this format.
               line page (wide)    p.20 exactly: the master photograph
                   placed as on the page, the extended lockup over it, the
                   line broken where the model stands.
             The red (215,78,60) is SAMPLED off p.30; it is not among the
             CI's printed colours, so it is kept as drawn. */
          visual: { kind: 'fourth',
                    post:   'img/moray-line-fourth-post.jpg',     /* CI PDF p.30, the placed image */
                    logo:   'img/the-fourth-logo-white.svg',      /* client's logos-02.svg, reversed */
                    red:    '#D74E3C',
                    byline: 'img/mainmarks-wordmark.svg', moray: 'img/moray-logo.svg',
                    master: 'img/moray-line-fourth-master.jpg',   /* CI PDF p.20, the placed image, 2739 px */
                    lockup: 'img/the-fourth-lockup.svg' },        /* CI PDF p.20 minus the photo, vector */
          imgSource: 'The Fourth CI, PDF p.20, 30 (master visual, post layout)',
          line:   'Beyond the third, into the fourth.',               lineSource: 'The Fourth brochure, PDF p.10',
          /* build 193: Unit sizes read off the brochure's six AREA BREAKDOWN tables (PDF p.14-16, "Total
             sellable Area"): smallest D1-413 43 m², largest B401 467 m² (both printed on the plans beside
             the tables too); the 18 sizes corrected from the 28 Oct plan (inventory planAreas) all fall
             inside it. The card shows only this one (Muhanad, 24 Nov 2026). */
          facts:  [ { k: 'Unit sizes', v: '43 – 467 m²' }, { k: 'Units', v: '153 administrative' }, { k: 'Area', v: '13,027 m² + 609 m² terraces' } ],
          factsSource: 'The Fourth brochure, PDF p.10, 14-16',
          lit:    'img/moray-night-167-fourth.webp',     /* the fourth-floor band only */
          floors: ['fourth'],                   /* "Positioned on the fourth floor" — CI PDF p.4 */

          /* --- the line page (build 70): as Moray Wellness. WHICH ROWS:
             Type "Admin" on the Fourth floor (A01, D3, D4 today). */
          layout: 'plan',
          match:  { type: ['Admin'], floors: ['fourth'] },
          /* FIND A UNIT, FOR THIS PRODUCT (build 112): from the finished project, not today's sheet. 153 offices on the 4th floor, 22 of them with a private terrace (The Fourth brochure PDF p.13-16: the terrace area is printed per unit; those 22 codes are listed here). A "Terrace" figure in the sheet wins over the list. */
          filters: {
            floors: ['fourth'],
            sizes: [
              { id: 'o60', label: 'Up to 60 m²', lo: 0, hi: 60 },
              { id: 'o100', label: '61–100 m²', lo: 60, hi: 100 },
              { id: 'o200', label: '101–200 m²', lo: 100, hi: 200 },
              { id: 'o500', label: '201–500 m²', lo: 200, hi: 500 },
              { id: 'omax', label: 'Over 500 m²', lo: 500, hi: Infinity }
            ],
            facets: [
              { id: 'terrace', label: 'Terrace', column: 'terrace', positive: 'with', otherwise: 'none',
                options: [ { id: 'with', label: 'With terrace' }, { id: 'none', label: 'No terrace' } ],
                rules: [ { is: 'with', codes: ['A401', 'A402', 'A403', 'A404', 'A405', 'B401', 'B402', 'B403', 'B416C', 'B417C',
                  'D1-401', 'D1-415', 'D1-416', 'D1-417', 'D4-407', 'D4-410', 'E401', 'E449', 'E450', 'E451', 'E452', 'E453'] } ] }
            ]
          },
          stepFloors: ['fourth'],
          place:  'North 90th Street, New Cairo',
          /* Tapping the card builds The Fourth's own post, CI p.30
             ("centered placement"), on void black: the line draws across at
             the F's crossbar ("match the line thickness to the horizontal
             stroke of the F; align it as a natural extension of the F",
             CI p.19) and lands in the red squares at both edges; FOURTH
             RISES out of it letter by letter — "the place where ambition
             rises", "elevation should be visible in every detail" (CI p.8-9);
             THE settles on top, LEVEL OF BUSINESS is written on, and the
             post's foot arrives: BY/ MAIN MARKS MORAY, 1ST MARK / NEW CAIRO.
             Every shape is a path of the client's own logo file. */
          /* BUILD 155, THE CARD ON THE MORAY PAGE (Main Marks' design notes, 11 Nov 2026: "Please use every section with its identity"): their picture on top, then a band in the line's colour carrying the MORAY wordmark (or the line's own logo) with the line's name centred under it. The colours are SAMPLED off their mock until the line's brand book file is with us. js/project.js lineCard. */
          card:   { photo: 'img/moray-card-fourth.jpg', overlay: 'img/the-fourth-logo-white.svg', ground: '#FFFFFF', ink: '#000000', accent: '#F4F4F1',
                    logo: 'img/moray-logo.svg', logoInk: 'black', sub: 'Premium offices with view',
                    photoSource: 'Main Marks, sales app footage, 11 Nov 2026 (magnific__skin-enhancer__44749.png)',
                    facts: ['Unit sizes'] },   /* build 193 (Muhanad, 24 Nov 2026): the card carries only the sizes */
          /* build 164 (Muhanad, 16 Nov 2026: every card opens "exactly as simple as the commercial card and the
             admin card, the same exact style"): the Moray letters build with the line's name under it, as
             Commercial and Offices. Until 163 it was The Fourth's own post build: kind 'fourth', src
             'img/the-fourth-logo-white.svg', ground '#090909', red '#D74E3C', byline 'img/mainmarks-wordmark.svg',
             moray 'img/moray-logo.svg' (js/markbuild.js runFourth, kept). */
          /* build 193: The Fourth's own logo, simply (js/markbuild.js runLogo): the client's logos-02.svg,
             reversed white. Until 192: kind 'letters' (the MORAY letters). */
          markBuild: {
            kind:    'logo',
            src:     'img/the-fourth-logo-white.svg',
            width:   0.74,
            sub:     'Premium offices with view', /* build 155: under the logo, centred (their notes) */
            source:  'The Fourth logos (logos-02.svg)'
          }
        },
        { id: 'wellness', released: true,
          name:   'Moray Wellness',
          badge:  'Clinics',
          ground: '#095569', ink: '#FFFFFF', accent: '#15BEE8',   /* deep teal ground — Wellness CI PDF p.6; accent = its supportive cyan (same page), since the orange would read as the three oranges beside it */
          /* The template, measured off CI PDF p.10 (post 466 x 570 pt): bars
             36 pt wide = 7.7% of the post; the orange bar runs the top 83%
             over a #191819 foot; right, #12A2C6 then #15BEE8 to 48%, then
             #095569 to the foot; the logo is 50% of the post wide, 5% down.
             The orange is SAMPLED off the page (246,124,75): it is not one
             of the CI's printed hexes, so it is kept as drawn. */
          visual: { kind: 'wellness-template',
                    render: 'img/moray-line-wellness-render.jpg',  /* CI PDF p.10, the placed image */
                    logo:   'img/moray-wellness-logo.svg',          /* white — CI PDF p.11 */
                    byline: 'img/mainmarks-wordmark.svg',
                    orange: '#F67C4B', foot: '#191819',
                    right:  [ ['#12A2C6', 6], ['#15BEE8', 48], ['#095569', 100] ] },  /* colour, ends at % */
          imgSource: 'Moray Wellness CI, PDF p.10-11, 14 (template, render, logo colours)',
          line:   'This is where the art of healing finds its stage.', lineSource: 'Moray brochure, PDF p.37',
          facts:  [ { k: 'Unit sizes', v: '41 – 203 m²' }, { k: 'Buildings', v: '2 clinical' } ],
          factsSource: 'Moray brochure, PDF p.14, 37',
          lit:    'img/moray-night-163-wellness.webp',   /* the two Clinics blocks, PDF p.20 */
          floors: ['first', 'second', 'third'],  /* "Clinics" in their legends, PDF p.20-22 */

          /* --- the line page, laid out as the CCR app's Ayyam page (build 49)
             hero, facts, then the aerial in place of Ayyam's master plan with
             this line's buildings lit and selectable, then Building & unit.
             js/project.js linePage(). */
          layout: 'plan',
          /* WHICH ROWS OF THE SHEET ARE THIS LINE (build 68): every row whose
             Type is Clinic. A clinic added to the sheet — on any floor, in any
             building — joins this page with no change here. */
          match:  { type: ['Clinic'] },
          /* FIND A UNIT, FOR THIS PRODUCT (build 112): from the finished project, not today's sheet. Clinics on the 1st to 3rd floors of the two clinic buildings, 41 to 203 m2 (Moray brochure PDF p.20-22, p.37). A clinic the sheet puts on another floor brings its own chip. */
          filters: {
            floors: ['first', 'second', 'third'],
            sizes: [
              { id: 'w60', label: 'Up to 60 m²', lo: 0, hi: 60 },
              { id: 'w80', label: '61–80 m²', lo: 60, hi: 80 },
              { id: 'w100', label: '81–100 m²', lo: 80, hi: 100 },
              { id: 'w150', label: '101–150 m²', lo: 100, hi: 150 },
              { id: 'wmax', label: 'Over 150 m²', lo: 150, hi: Infinity }
            ]
          },
          /* The floors a clinic building has, per Muhanad (2026-10-01): "the
             building contains medical units from the first till the fourth
             floor". Shown even while a floor has nothing on sale, so a unit
             added there has a place to appear. (Brochure legends p.20-22 show
             clinics on 1st-3rd, and the sheet lists A's 4th floor as Admin —
             asked of Main Marks.) */
          stepFloors: ['first', 'second', 'third', 'fourth'],
          place:  'North 90th Street, New Cairo',

          /* Tapping the card builds the Wellness logo (js/markbuild.js,
             "letters"): the top row of the file — MORAY — rises letter by
             letter as Moray's own entry does; the second row — the script
             "Wellness" — is written on left to right, as a hand would. Both
             are the CI's own vector paths (CI p.11), nothing drawn. The bars
             are the CI p.10 template's; the line under the logo is the
             template's own "1ST MARK / NEW CAIRO". */
          /* BUILD 155, THE CARD ON THE MORAY PAGE (Main Marks' design notes, 11 Nov 2026: "Please use every section with its identity"): their picture on top, then a band in the line's colour carrying the MORAY wordmark (or the line's own logo) with the line's name centred under it. The colours are SAMPLED off their mock until the line's brand book file is with us. js/project.js lineCard. */
          /* build 157: THEIR PICTURE, the woman in the white dress, from the Wellness brand book they sent
             (Moray Wellness (medical) guidelines.pdf p.4, 320 x 480 px, the largest copy in it), framed as their
             mock frames it (sales app.pdf p.4): white 17.7%, the photo 59%, then the teal panels 23.3%,
             #377484 over #2A6878 (sampled off the mock). */
          card:   { photo: 'img/moray-card-wellness.jpg', ground: '#E78257', ink: '#FFFFFF', accent: '#15BEE8',
                    frame: { ground: '#FFFFFF', inset: { left: '17.7%', width: '59%' }, position: '50% 70%' },
                    bars: { right: [['#377484', 62], ['#2A6878', 100]] }, barWidth: { right: '23.3%' },
                    coverBars: { right: '#095569' },   /* the offer's cover keeps its 156 bar (js/pdf.js) */
                    logo: 'img/moray-wellness-logo.svg', logoTall: true, sub: 'Clinical units', photoSource: 'Moray Wellness (medical) guidelines p.4; framing: sales app.pdf p.4',
                    facts: ['Unit sizes'] },   /* build 193 (Muhanad, 24 Nov 2026): the card carries only the sizes */
          /* build 164 (Muhanad, 16 Nov 2026): opens exactly as Commercial and Offices, the Moray letters build with
             the line's name under it. Until 163: src 'img/moray-wellness-logo.svg', script: true (handwritten
             second row), tagline ['1st Mark', 'New Cairo'], bars { left '#F67C4B', foot '#191819', right
             [['#12A2C6', 6], ['#15BEE8', 48], ['#095569', 100]] } (Moray Wellness CI p.10-11). */
          /* build 193: the Moray Wellness logo, simply (js/markbuild.js runLogo), lifted off the Wellness CI.
             Until 192: kind 'letters' (the MORAY letters). */
          markBuild: {
            kind:    'logo',
            src:     'img/moray-wellness-logo.svg',
            width:   0.62,
            sub:     'Clinical units',            /* build 155: under the logo, centred (their notes) */
            source:  'Moray Wellness CI (logo)'
          },

          /* The clinic buildings, named as MAIN MARKS' INVENTORY names them
             (05 Sales & pricing\Main Marks Inventory.xlsx, sheet Moray, read
             2026-09-30). Where each one is: brochure PDF p.20 shades the back
             half of building E (E111-E135) and the back half of building A
             (A120-A138) blue = Clinics; the inventory's E02 unit codes
             (E113-E235) sit in that half of E.
               `roof`   the outline on the aerial, in its 1672 x 941 pixels —
                        TRACED BY HAND with tools/trace-clinic-roofs.html. Null
                        until traced: the building is then chosen from the row
                        of names, and nothing is drawn on the picture for it.
               `light`  the box on the lit aerial that holds THIS building's
                        lights, so picking one turns the other off. Measured
                        off a difference image of the lit and unlit aerials:
                        every lit pixel of A falls in x 451-701 / y 123-295 and
                        of E in x 1330-1583 / y 220-420; nothing else changes
                        but the right MORAY sign, which stays unlit.
               `units`  clinic units per floor, COUNTED from that file (not
                        typed from a brochure). Counts only: no price leaves
                        the file. `hold` = its "Hold" status, not sellable. */
          buildings: [
            { id: 'E', name: 'Building E', side: 'right',
              inventory: 'E02',   /* what the inventory sheet calls it; the building is E */
              light: [1274, 180, 1596, 434],   /* its lights on the lit aerial, x0 y0 x1 y1 px (build 158: measured off the new pictures) */
              /* build 158: the roof of E2 on Main Marks' own render, traced off 3x zoom tiles and drawn back to check */
              roof: [
                [1321, 274], [1380, 288], [1447, 300], [1477, 302], [1487, 297], [1497, 283], [1523, 253], [1547, 228], [1548, 221], [1527, 217], [1480, 208], [1427, 200], [1405, 200], [1363, 237] ], },
            { id: 'A',   name: 'Building A',   side: 'left',
              inventory: 'A',
              light: [464, 78, 781, 246],
              /* build 158: the roof of A2 on Main Marks' own render */
              roof: [
                [512, 150], [547, 160], [590, 166], [600, 164], [630, 155], [680, 142], [730, 124], [732, 119], [693, 108], [653, 103], [613, 115], [563, 130], [520, 145] ], }
          ],
          buildingsSource: 'Main Marks Inventory.xlsx (sheet Moray), 29 Sep 2026; positions: Moray brochure PDF p.20'
        },
        { id: 'residence', released: true,
          name:   'R- Residence',
          badge:  'Serviced apartments',
          ground: '#191819', ink: '#FFFFFF', accent: '#F59421',   /* Moray ink; the lockup's slash, Moray CI secondary */
          /* build 194 (Muhanad, 24 Nov 2026, on a screenshot of the page top "R- RESIDENCE by / MORAY": "what
             should be on top should be R residence logo only"): the page top is the R RESIDENCE logo alone
             (img/r-residence-logo-white.svg, lifted off its brand book). Until 193: { kind: 'moray-endorsed',
             logo: 'img/moray-logo.svg', over: 'R- Residence', by: 'by' } (Moray brochure PDF p.39). */
          mark:   { kind: 'logo', logo: 'img/r-residence-logo-white.svg' },
          img:    'img/moray-line-residence.jpg', imgSource: 'Moray brochure, PDF p.40',
          line:   'Fully furnished serviced apartments.',             lineSource: 'Moray brochure, PDF p.40',
          facts:  [ { k: 'Unit sizes', v: '38 – 83 m²' }, { k: 'Buildings', v: '4 serviced apartments' } ],
          factsSource: 'Moray brochure, PDF p.14, 40',
          lit:    'img/moray-night-162-residence.webp',  /* the four back-row blocks; which blocks are serviced is INFERRED, not confirmed by the client */
          floors: null,                          /* not on any legend — every plan is shown */

          /* --- the line page (build 70): as Moray Wellness. Main Marks'
             sheet has NO serviced-apartment rows yet (brief §9 Q3), so the
             page says so and offers nothing. WHICH ROWS: the Type word they
             will use is NOT KNOWN; these are the likely spellings, matched
             case-blind. A row typed any other way does not appear (fail
             closed) — confirm the word when the rows arrive. */
          layout: 'plan',
          match:  { type: ['Serviced', 'Serviced Apartment', 'Serviced Apartments', 'Residence', 'R- Residence', 'Hotel Apartment'] },
          /* FIND A UNIT, FOR THIS PRODUCT (build 112): from the finished project, not today's sheet. Serviced apartments on the 1st to 4th floors of HA-HD, 38 to 83 m2, in three unit types (Moray brochure PDF p.40, p.44-54). The unit type is read from the sheet's Bedrooms column; its wording is not known yet. */
          filters: {
            floors: ['first', 'second', 'third', 'fourth'],
            sizes: [
              { id: 'r45', label: 'Up to 45 m²', lo: 0, hi: 45 },
              { id: 'r60', label: '46–60 m²', lo: 45, hi: 60 },
              { id: 'rmax', label: 'Over 60 m²', lo: 60, hi: Infinity }
            ],
            facets: [
              { id: 'layout', label: 'Unit type', column: 'bedrooms',
                options: [
                  { id: 'junior', label: 'Junior studio', words: ['junior'] },
                  { id: 'studio', label: 'Studio',        words: ['studio', '0'] },
                  { id: 'one',    label: 'One bedroom',   words: ['one', '1'] }
                ] }
            ]
          },
          stepFloors: [],
          place:  'North 90th Street, New Cairo',
          /* Tapping the card builds the brochure's lockup, PDF p.39: the
             long slash draws up, MORAY rises letter by letter, and
             "R- RESIDENCE by" arrives over it. */
          /* BUILD 155, THE CARD ON THE MORAY PAGE (Main Marks' design notes, 11 Nov 2026: "Please use every section with its identity"): their picture on top, then a band in the line's colour carrying the MORAY wordmark (or the line's own logo) with the line's name centred under it. The colours are SAMPLED off their mock until the line's brand book file is with us. js/project.js lineCard. */
          /* build 157: THEIR PICTURE WITH THE R RESIDENCE LOGO, cut from their mock (sales app.pdf p.4, 477 x 341 px;
             the R Residence brand book has not this photograph). The mock cuts it at the top, and the logo runs
             the full width, so it is held whole at the card's foot and its top fades into the photo's own dark. */
          /* build 193 (Muhanad, 24 Nov 2026): the card's "Open R- Residence" line and arrow (and its dot and
             touched edge) in the R Residence TERRACOTTA RED, no longer Moray's orange #F59421: rgb(174,41,36)
             = #AE2924, read off the swatch itself (R Residence option 1 small.pdf p.10 and the red panel on
             p.11; the page prints #AE2925). The card carries only the sizes. */
          card:   { photo: 'img/moray-card-residence.jpg', ground: '#034640', ink: '#FFFFFF', accent: '#AE2924',
                    frame: { ground: '#15110C', foot: true },
                    logo: 'img/moray-logo.svg', sub: 'Serviced apartments', photoSource: 'Main Marks, sales app.pdf p.4 (their mock)',
                    facts: ['Unit sizes'] },
          /* build 164 (Muhanad, 16 Nov 2026): opens exactly as Commercial and Offices. Until 163 it also drew the
             brochure lockup over the wordmark: over ['R- Residence', 'by'] (Moray brochure PDF p.39). */
          /* build 193: the R RESIDENCE logo, simply (js/markbuild.js runLogo): the R in its square over
             RESIDENCE, lifted as vector paths off their brand book (R Residence option 1 small.pdf p.11, the
             white-on-charcoal version), nothing redrawn. Until 192: kind 'letters' (the MORAY letters). */
          markBuild: {
            kind:    'logo',
            src:     'img/r-residence-logo-white.svg',
            width:   0.62,
            sub:     'Serviced apartments',         /* build 155: under the logo, centred (their notes) */
            source:  'R Residence option 1 small.pdf p.11 (logo)'
          }
        }
      ],

      /* THE FLOOR DRAWINGS (2026-11-03): Main Marks' original colored plans (WeTransfer
         "00_Colored plans", 14852 x 11229 px, about 8x the brochure's), each lined up with the brochure
         picture it replaces (one scale and offset per floor, every quarter of the drawing within 0.5 px)
         and baked into THAT picture's frame at 2x, cut to its own site outline. So `w` x `h` is the frame
         `plates` and `unitShapes` are measured in, and the picture carries twice its pixels.
         FOURTH: the brochure's p.23 showed the roof gardens, with no offices on it; this is the real
         fourth floor (Main Marks' revision of 28 Oct 2026), in the same frame.
         Made by scripts/make-floor-image.js from the fits of scripts/fit-floor.js. Re-make, never edit.
         The legends are the brochure's (the same drawings). */
      floorsTitle: 'Master plan & floor plans',
      floors: [
        { id: 'master', name: 'Master plan',  img: 'img/moray-plan-master.webp', w: 1532, h: 1355, legend: [], source: 'Main Marks, roof and master plan, 18 Sep 2025' },
        { id: 'street', name: 'Street level', img: 'img/moray-plan-street.webp', w: 1445, h: 1332, legend: ['Retail', 'Bank', 'Pharmacy'], source: 'Main Marks, street level plan, 11 Sep 2025' },
        { id: 'ground', name: 'Ground',       img: 'img/moray-plan-ground.webp', w: 1801, h: 1370, legend: ['F&B', 'Retail', 'Showroom', 'Pharmacy'], source: 'Main Marks, ground floor plan, 10 Sep 2025' },
        { id: 'first',  name: 'First',        img: 'img/moray-plan-first.webp',  w: 1451, h: 1348, legend: ['Admin', 'Clinics', 'Showroom'], source: 'Main Marks, first floor plan, 10 Sep 2025' },
        { id: 'second', name: 'Second',       img: 'img/moray-plan-second.webp', w: 1741, h: 1370, legend: ['Admin', 'Clinics'], source: 'Main Marks, second floor plan, 10 Sep 2025' },
        { id: 'third',  name: 'Third',        img: 'img/moray-plan-third.webp',  w: 1805, h: 1332, legend: ['Admin', 'Clinics'], source: 'Main Marks, third floor plan, 10 Sep 2025' },
        { id: 'fourth', name: 'Fourth',       img: 'img/moray-plan-fourth.webp', w: 1647, h: 1333, legend: [], source: 'Main Marks, fourth floor plan, 28 Oct 2026' }
      ],

      /* THE 14 BUILDINGS (build 107). `holds` = the products Muhanad ticked for each, 2026-10-05. BUILD 207 (Muhanad, 26 Nov 2026: "the commercial is in the ground floor in all the buildings ... the wellness building ... is in the typical floor"): every building holds commercial (A2, C2, E2 added).
         ROOFS, BUILD 158: re-traced on Main Marks' own render (1672 x 941 px) off 3x zoom tiles with a
         10 px grid, then drawn back on the render and looked at; within a few pixels. The same outlines
         place the light (scripts/night-aerial/roofs.json). His hand traces of build 107 were on the old picture.
         NAMES: read off The Fourth brochure's labelled master plan (PDF p.13) and its unit tables (p.14-16),
         the Moray brochure plans (p.19-20: C101-C104, HA-HD) and the sheet. Front row A1 B1 C1 D1-D2 E1,
         middle row A2 B2 C2 D3-D4 E2, back row HA HB HC HD. "C1"/"C2" are OUR names for the front and back
         centre blocks: the brochure calls both "C".
         `sheet` = what the inventory's Bldg column calls it. The sheet's "A" is A2 (clinics) and "A01" is A1;
         "D1" and "D2" are one block, so are "D3" and "D4"; "E01" is ASSUMED for E1 (no rows yet).
         The sheet's "B" is TWO blocks: `units` tells them apart by the last two digits of the unit code,
         from The Fourth's tables (B1 = 01-08 and 27-33, B2 = 10-24), ASSUMED the same on every floor.
         A unit that fits no building lights no roof (fail closed); it is still in the lists.
         HOW IT IS USED (js/lineflow.js): on a product page a building is outlined, light blue and tappable,
         ONLY while the sheet has an AVAILABLE unit of that product there (build 108; the grey "holds it but
         nothing available" outline of build 107 was dropped at his word). `holds` only limits which roofs a
         line may light.
         `street` (build 111) = THE STREET-LEVEL SHOPS UNDER THIS BUILDING, as the start of their unit code.
         The sheet files every such shop under Bldg "ST", which names no building; Muhanad, 2026-10-05:
         attach each shop to the building above it, so that roof glows and a tap shows what it carries on
         the street level and the ground floor. Read by POSITION: the street-level plan (Moray brochure
         PDF p.18) laid over the ground-floor plan (p.19), which share one outline. ST02B/ST02A and the two
         STC groups were split the same way. NOT confirmed by Main Marks. A shop that fits no building
         stays under "Street level" in the list and lights no roof.
         `showrooms` (build 112) = the building has SHOWROOMS ON ITS FIRST FLOOR: the five front-row blocks, by the
         green on the brochure's first-floor plan (PDF p.20). With `street` it decides a building's floor cards
         on the Commercial page (ground floor in all 14). */
      /* BUILD 172 (Muhanad, 18 Nov 2026): `outline` traced by him for 10 of the 14 (A1 B1 C1 D1-D2 E1 A2 B2 C2 D3-D4 E2,
         tools/trace-buildings.html, written by scripts/apply-building-outlines.js unchanged). HA HB HC HD: not yet
         ("we will do it later"); they still use `roof`. On C1 and C2 he goes round the shade canopies on the roof. */
      /* BUILD 166 (Muhanad, 17 Nov 2026): a building has three shapes on the aerial, all in 1672 x 941.
         `outline` = the TOP of the building (its roof edge) traced by Muhanad in tools/trace-buildings.html: the line
                     that glows on a product page, and the roof that lights when the building is chosen;
         `roof`    = the older roof tracing, used where `outline` is not traced yet;
         `area`    = everything of the building the camera sees, from the night picture's own building shapes
                     (scripts/make-building-tracer.js): the product's lit floors are cut out of the line's lit
                     picture with it. Made by code, not by hand. */
      buildings: [
        { id: 'A1', name: 'Building A1', sheet: ['A01'], holds: ['commercial', 'admin', 'fourth'], showrooms: true, street: ['ST09', 'ST10', 'ST11', 'ST12', 'ST13', 'ST14'],
          outline: [[495, 159], [488, 158], [483, 159], [478, 160], [472, 162], [117, 265], [114, 266], [112, 267], [111, 269], [111, 272], [114, 274], [117, 275], [120, 275], [124, 275], [132, 274], [141, 273], [154, 272], [158, 272], [161, 272], [164, 272], [178, 270], [343, 254], [354, 253], [364, 251], [374, 248], [449, 225], [462, 221], [471, 218], [569, 182], [579, 178], [579, 177], [579, 176], [578, 175], [576, 175]],
          area: [[527.5, 166.5], [574.5, 166.5], [578.5, 190.5], [582.5, 190.5], [396.5, 298.5], [385.5, 311.5], [384.5, 365.5], [369.5, 372.5], [329.5, 377.5], [167.5, 383.5], [105.5, 382.5], [105.5, 306.5], [101.5, 291.5], [101.5, 286.5], [105.5, 283.5], [105.5, 270.5], [123.5, 264.5], [182.5, 254.5], [258.5, 233.5], [314.5, 213.5], [375.5, 195.5], [426.5, 177.5], [478.5, 174.5]],
          roof: [[105, 270], [160, 270], [260, 266], [340, 261], [370, 256], [388, 247], [440, 231], [510, 211], [560, 196], [578, 184], [574, 166], [530, 166], [475, 174], [427, 177], [380, 193], [330, 208], [260, 232], [185, 253], [120, 265]] },
        { id: 'B1', name: 'Building B1', sheet: ['B'], units: [[1, 9], [25, 99]], holds: ['commercial', 'admin', 'fourth'], showrooms: true,
          outline: [[632, 190], [638, 188], [643, 188], [648, 188], [741, 207], [744, 208], [746, 209], [745, 211], [743, 212], [692, 234], [688, 238], [643, 271], [639, 273], [635, 274], [631, 276], [626, 278], [621, 279], [615, 280], [407, 310], [402, 310], [398, 310], [395, 310], [393, 310], [391, 309], [391, 308], [392, 307], [394, 306], [396, 304], [400, 302], [482, 254], [490, 249], [495, 246], [499, 244], [503, 241], [507, 239], [511, 238], [520, 233]],
          area: [[583.5, 190.5], [704.5, 200.5], [746.5, 205.5], [748.5, 213.5], [751.5, 214.5], [751.5, 299.5], [748.5, 300.5], [748.5, 322.5], [699.5, 354.5], [674.5, 374.5], [656.5, 384.5], [646.5, 389.5], [587.5, 407.5], [572.5, 415.5], [530.5, 415.5], [476.5, 421.5], [386.5, 435.5], [386.5, 311.5], [393.5, 302.5], [421.5, 284.5]],
          roof: [[386, 311], [413, 308], [480, 300], [547, 295], [572, 297], [587, 290], [613, 282], [647, 273], [673, 260], [700, 240], [727, 223], [748, 210], [746, 205], [700, 200], [650, 196], [583, 190], [540, 215], [500, 238], [460, 262], [420, 285], [395, 300]] },
        { id: 'C1', name: 'Building C1', sheet: [], holds: ['commercial'], showrooms: true,   /* build 160: not an office building (Muhanad, 16 Nov 2026; no office unit in the sheet) */ street: ['STC01', 'STC02', 'STC03', 'STC04', 'STC05'],
          outline: [[816, 246], [793, 257], [790, 260], [790, 262], [791, 265], [793, 267], [841, 310], [845, 312], [849, 312], [853, 312], [857, 310], [954, 255], [886, 248], [879, 247], [881, 249], [882, 251], [882, 252], [880, 254], [862, 264], [822, 257], [828, 253]],
          area: [[828.5, 232.5], [872.5, 235.5], [944.5, 249.5], [947.5, 250.5], [952.5, 257.5], [952.5, 342.5], [929.5, 360.5], [929.5, 380.5], [917.5, 387.5], [909.5, 384.5], [908.5, 392.5], [868.5, 414.5], [848.5, 420.5], [801.5, 386.5], [790.5, 368.5], [790.5, 258.5], [803.5, 238.5]],
          roof: [[790, 258], [800, 275], [847, 310], [870, 303], [952, 257], [947, 250], [870, 235], [830, 232], [803, 238]] },
        { id: 'D1-D2', name: 'Building D1-D2', sheet: ['D1', 'D2'], holds: ['commercial', 'admin', 'fourth'], showrooms: true,
          outline: [[934, 349], [994, 296], [998, 293], [1004, 289], [1070, 247], [1073, 245], [1077, 244], [1080, 243], [1085, 242], [1089, 242], [1094, 243], [1216, 265], [1219, 267], [1221, 269], [1221, 271], [1220, 273], [1217, 276], [1157, 324], [1055, 448], [1052, 451], [1050, 453], [1046, 453], [1043, 453], [1038, 452], [1034, 450], [933, 363], [930, 360], [929, 358], [929, 355], [931, 352]],
          area: [[1077.5, 254.5], [1181.5, 262.5], [1218.5, 267.5], [1222.5, 273.5], [1222.5, 333.5], [1212.5, 343.5], [1212.5, 357.5], [1197.5, 368.5], [1189.5, 365.5], [1153.5, 400.5], [1155.5, 401.5], [1132.5, 427.5], [1112.5, 457.5], [1057.5, 558.5], [1038.5, 566.5], [1026.5, 556.5], [1014.5, 554.5], [996.5, 545.5], [924.5, 476.5], [909.5, 474.5], [909.5, 385.5], [929.5, 393.5], [930.5, 360.5], [932.5, 358.5], [1001.5, 306.5]],
          roof: [[930, 360], [985, 405], [1038, 450], [1057, 448], [1090, 400], [1110, 373], [1143, 333], [1163, 315], [1200, 290], [1222, 273], [1218, 267], [1177, 262], [1083, 255], [1077, 254], [1043, 277], [1000, 307], [960, 337]] },
        { id: 'E1', name: 'Building E1', sheet: ['E01'], holds: ['commercial', 'admin', 'fourth'], showrooms: true,
          outline: [[1324, 287], [1318, 286], [1312, 285], [1308, 286], [1304, 287], [1301, 289], [1247, 338], [1244, 342], [1242, 345], [1241, 349], [1240, 353], [1239, 357], [1239, 361], [1240, 366], [1241, 370], [1242, 374], [1244, 379], [1256, 414], [1258, 417], [1261, 420], [1265, 423], [1497, 543], [1503, 545], [1509, 547], [1514, 548], [1519, 549], [1524, 549], [1527, 549], [1531, 548], [1534, 547], [1536, 546], [1538, 544], [1539, 542], [1540, 539], [1540, 536], [1444, 383], [1441, 378], [1439, 374], [1439, 369], [1439, 365], [1441, 362], [1443, 359], [1471, 323], [1472, 319], [1471, 315], [1469, 313], [1405, 302]],
          area: [[1300.5, 289.5], [1422.5, 307.5], [1472.5, 318.5], [1472.5, 429.5], [1502.5, 475.5], [1539.5, 548.5], [1539.5, 560.5], [1542.5, 562.5], [1547.5, 585.5], [1543.5, 640.5], [1539.5, 648.5], [1539.5, 696.5], [1511.5, 690.5], [1501.5, 685.5], [1273.5, 559.5], [1247.5, 543.5], [1245.5, 539.5], [1236.5, 535.5], [1236.5, 517.5], [1233.5, 512.5], [1233.5, 380.5], [1236.5, 368.5], [1240.5, 353.5], [1244.5, 348.5], [1283.5, 304.5]],
          roof: [[1300, 289], [1350, 296], [1420, 307], [1472, 318], [1468, 337], [1440, 360], [1437, 372], [1445, 392], [1473, 430], [1503, 477], [1530, 530], [1539, 548], [1510, 543], [1443, 510], [1377, 477], [1310, 443], [1270, 423], [1247, 410], [1233, 380], [1240, 353], [1260, 330], [1287, 300]] },
        { id: 'A2', name: 'Building A2', sheet: ['A'], holds: ['wellness', 'commercial'], street: ['ST04', 'ST05', 'ST06', 'ST07', 'ST08'],
          outline: [[624, 108], [637, 105], [640, 104], [642, 104], [651, 105], [661, 102], [728, 113], [720, 117], [732, 120], [615, 163], [609, 164], [604, 164], [600, 164], [596, 164], [516, 148], [514, 147], [513, 146], [513, 145], [515, 144], [519, 143], [550, 132]],
          area: [[652.5, 103.5], [694.5, 108.5], [730.5, 118.5], [732.5, 119.5], [732.5, 132.5], [733.5, 133.5], [735.5, 131.5], [735.5, 147.5], [672.5, 177.5], [672.5, 197.5], [601.5, 191.5], [600.5, 184.5], [579.5, 190.5], [579.5, 184.5], [574.5, 165.5], [527.5, 165.5], [512.5, 168.5], [512.5, 150.5], [522.5, 144.5], [565.5, 129.5]],
          roof: [[512, 150], [547, 160], [590, 166], [600, 164], [630, 155], [680, 142], [730, 124], [732, 119], [693, 108], [653, 103], [613, 115], [563, 130], [520, 145]] },
        { id: 'B2', name: 'Building B2', sheet: ['B'], units: [[10, 24]], holds: ['commercial', 'admin', 'fourth'],
          outline: [[676, 173], [776, 134], [779, 133], [783, 133], [787, 133], [797, 134], [808, 130], [886, 138], [889, 139], [889, 140], [887, 142], [877, 146], [882, 147], [886, 147], [888, 148], [889, 148], [888, 149], [787, 194], [784, 196], [781, 197], [777, 197], [772, 197], [767, 197], [761, 196], [684, 181], [676, 179], [673, 178], [672, 177], [673, 175]],
          area: [[769.5, 134.5], [889.5, 145.5], [893.5, 150.5], [893.5, 160.5], [894.5, 161.5], [899.5, 158.5], [899.5, 187.5], [884.5, 200.5], [877.5, 213.5], [876.5, 218.5], [852.5, 232.5], [828.5, 231.5], [803.5, 237.5], [790.5, 256.5], [789.5, 264.5], [773.5, 271.5], [752.5, 270.5], [752.5, 214.5], [749.5, 213.5], [747.5, 205.5], [732.5, 202.5], [673.5, 197.5], [673.5, 177.5], [719.5, 155.5]],
          roof: [[673, 177], [713, 190], [747, 196], [772, 197], [823, 182], [863, 163], [893, 150], [889, 145], [830, 140], [770, 134], [720, 155]] },
        { id: 'C2', name: 'Building C2', sheet: [], holds: ['commercial'], street: ['STC06', 'STC07', 'STC08', 'STC09', 'STC10'],
          outline: [[1027, 198], [1038, 200], [1001, 221], [879, 213], [920, 192], [934, 200], [937, 201], [940, 201], [944, 200], [947, 198], [966, 189], [986, 192], [986, 205], [999, 195]],
          area: [[907.5, 181.5], [980.5, 188.5], [1038.5, 197.5], [1040.5, 203.5], [1040.5, 273.5], [1007.5, 279.5], [953.5, 281.5], [953.5, 257.5], [947.5, 249.5], [878.5, 236.5], [878.5, 213.5], [881.5, 207.5], [885.5, 200.5]],
          roof: [[878, 213], [940, 211], [1005, 209], [1040, 203], [1038, 197], [985, 189], [907, 181], [885, 200]] },
        { id: 'D3-D4', name: 'Building D3-D4', sheet: ['D3', 'D4'], holds: ['commercial', 'admin', 'fourth'],
          outline: [[1105, 225], [1174, 181], [1178, 179], [1181, 178], [1185, 178], [1198, 180], [1208, 173], [1211, 171], [1215, 171], [1221, 171], [1313, 181], [1309, 185], [1321, 187], [1324, 187], [1325, 189], [1323, 190], [1246, 252], [1242, 253], [1238, 254], [1233, 255], [1228, 255], [1222, 254], [1110, 234], [1105, 232], [1102, 230], [1102, 228]],
          area: [[1212.5, 172.5], [1319.5, 183.5], [1324.5, 184.5], [1327.5, 187.5], [1327.5, 239.5], [1291.5, 274.5], [1254.5, 323.5], [1243.5, 335.5], [1221.5, 335.5], [1223.5, 333.5], [1223.5, 273.5], [1218.5, 266.5], [1181.5, 261.5], [1102.5, 255.5], [1103.5, 231.5], [1145.5, 201.5], [1202.5, 175.5]],
          roof: [[1102, 232], [1163, 246], [1223, 255], [1243, 255], [1255, 246], [1293, 210], [1327, 187], [1324, 184], [1270, 178], [1213, 172], [1203, 175], [1147, 200]] },
        { id: 'E2', name: 'Building E2', sheet: ['E02'], holds: ['wellness', 'commercial'],
          outline: [[1325, 266], [1398, 200], [1400, 199], [1403, 199], [1407, 199], [1410, 199], [1420, 200], [1421, 199], [1423, 197], [1427, 197], [1432, 197], [1525, 211], [1530, 212], [1531, 213], [1531, 215], [1530, 217], [1531, 218], [1543, 220], [1546, 220], [1548, 221], [1548, 223], [1490, 294], [1488, 297], [1485, 298], [1481, 299], [1475, 299], [1468, 299], [1462, 298], [1455, 297], [1449, 296], [1442, 295], [1436, 294], [1430, 293], [1423, 292], [1417, 290], [1411, 289], [1405, 288], [1399, 286], [1393, 285], [1387, 284], [1381, 282], [1377, 282], [1374, 282], [1372, 281], [1355, 278], [1347, 276], [1339, 275], [1335, 274], [1331, 273], [1328, 273], [1326, 272], [1324, 271], [1324, 269], [1325, 266]],
          area: [[1405.5, 200.5], [1430.5, 200.5], [1482.5, 208.5], [1548.5, 221.5], [1547.5, 314.5], [1519.5, 343.5], [1495.5, 371.5], [1488.5, 382.5], [1478.5, 388.5], [1473.5, 388.5], [1472.5, 317.5], [1422.5, 306.5], [1321.5, 291.5], [1321.5, 274.5]],
          roof: [[1321, 274], [1380, 288], [1447, 300], [1477, 302], [1487, 297], [1497, 283], [1523, 253], [1547, 228], [1548, 221], [1527, 217], [1480, 208], [1427, 200], [1405, 200], [1363, 237]] },
        /* HA, HC: the 17 Nov 2026 sheet lists their serviced apartments, every one "Block" (not for sale) */
        { id: 'HA', name: 'Building HA', sheet: ['HA'], holds: ['residence', 'commercial'], street: ['ST03'],
          area: [[717.5, 80.5], [763.5, 82.5], [815.5, 90.5], [822.5, 104.5], [822.5, 138.5], [769.5, 133.5], [736.5, 147.5], [736.5, 131.5], [735.5, 130.5], [733.5, 132.5], [733.5, 119.5], [697.5, 108.5], [697.5, 95.5]],
          roof: [[697, 95], [750, 103], [803, 110], [822, 104], [815, 90], [760, 82], [717, 80]] },
        { id: 'HB', name: 'Building HB', sheet: [], holds: ['residence', 'commercial'], street: ['ST02B'],
          area: [[857.5, 100.5], [966.5, 102.5], [1054.5, 110.5], [1058.5, 130.5], [1058.5, 188.5], [1045.5, 196.5], [1041.5, 196.5], [980.5, 187.5], [911.5, 180.5], [907.5, 180.5], [905.5, 182.5], [900.5, 181.5], [900.5, 158.5], [899.5, 157.5], [894.5, 160.5], [894.5, 150.5], [889.5, 144.5], [825.5, 139.5], [825.5, 116.5], [838.5, 106.5]],
          roof: [[825, 116], [900, 123], [980, 131], [1045, 138], [1058, 130], [1054, 110], [980, 103], [900, 100], [858, 100], [840, 105]] },
        { id: 'HC', name: 'Building HC', sheet: ['HC'], holds: ['residence', 'commercial'], street: ['ST02A'],
          area: [[1146.5, 125.5], [1206.5, 128.5], [1343.5, 139.5], [1351.5, 140.5], [1382.5, 151.5], [1384.5, 152.5], [1386.5, 168.5], [1386.5, 216.5], [1363.5, 236.5], [1328.5, 233.5], [1328.5, 187.5], [1324.5, 183.5], [1217.5, 171.5], [1202.5, 174.5], [1155.5, 195.5], [1145.5, 200.5], [1128.5, 213.5], [1113.5, 211.5], [1114.5, 140.5], [1125.5, 128.5]],
          roof: [[1113, 149], [1200, 158], [1290, 167], [1368, 175], [1386, 168], [1384, 152], [1350, 140], [1290, 135], [1200, 128], [1150, 125], [1125, 128], [1114, 140]] },
        { id: 'HD', name: 'Building HD', sheet: [], holds: ['residence', 'commercial'], street: ['ST01'],
          area: [[1430.5, 157.5], [1506.5, 160.5], [1570.5, 165.5], [1575.5, 178.5], [1575.5, 236.5], [1549.5, 258.5], [1548.5, 220.5], [1470.5, 205.5], [1430.5, 199.5], [1408.5, 199.5], [1408.5, 180.5], [1412.5, 168.5]],
          roof: [[1408, 180], [1480, 190], [1550, 200], [1575, 178], [1570, 165], [1500, 160], [1430, 157], [1412, 168]] }
      ],

      /* BUILDING CUTS on the floor drawings: x0, y0, x1, y1 in the floor's frame (config `floors` w x h).
         Keyed by the inventory sheet's building name; street shops by the building above them (`street`
         above, as js/lineflow.js joins them). Step 3 lifts this piece off the floor (js/lineflow.js floorPlate).
         E02 1st and 2nd and A 3rd are Muhanad's own cuts (tools/cut-buildings.html, 2026-10-01: the clinic wing).
         Every other cut (2026-11-03) is DERIVED: the box around all the units traced in that block on that
         floor, 10 px clear (past its outer walls). THE WHOLE BUILDING (Muhanad, 2026-11-03: "a tiny bit of the
         layout is cropped, the whole building should be shown"): D1 and D2 are one block, so both show the
         whole D1-D2 cut (one picture); the same for D3 and D4. Every unit of the line inside the cut glows
         (js/lineflow.js floorPlate), whichever sheet name it has; a tap on the other name opens its building. "A" is the clinics block A2, "A01" the front block A1, "E02" the back block E2,
         "E01" the front block E1 (the two blocks of a letter stand north and south of the bridge).
         "B1" (front) and "B2" (back) are the two blocks the sheet calls "B" (2026-11-03, Muhanad: "those 2
         buildings are selected together"): js/lineflow.js joins each B unit to its block by config `units`, and the
         drawn blocks agree with that rule for all 156 B units on the 1st to 4th floors. Made by scripts/make-config.js from the traces. */
      plates: {
        'A': { first: [68, 397, 256, 730], second: [199, 409, 387, 738], third: [269, 388, 453, 738], fourth: [90, 377, 278, 706], street: [27, 365, 144, 624] },        'A01': { first: [54, 751, 256, 1271], second: [186, 760, 387, 1281], third: [264, 738, 455, 1199], fourth: [77, 729, 278, 1240], street: [25, 647, 124, 967] },
        'B1': { first: [329, 751, 537, 1197], second: [461, 760, 668, 1207], third: [529, 738, 738, 1192], fourth: [353, 729, 558, 1167] },
        'B2': { first: [329, 370, 518, 730], second: [461, 382, 649, 738], third: [529, 360, 719, 717], fourth: [353, 352, 541, 706] },
        'C1': { first: [576, 715, 759, 997], second: [712, 744, 812, 950], third: [783, 721, 885, 930], street: [592, 731, 741, 931] },
        'C2': { first: [576, 498, 759, 720], second: [712, 506, 894, 727], third: [783, 483, 967, 706], street: [592, 500, 741, 676] },
        'D1': { first: [817, 635, 1039, 1117], second: [954, 644, 1175, 1127], third: [1031, 621, 1254, 1111], fourth: [855, 612, 1076, 1083] },
        'D2': { first: [817, 635, 1039, 1117], second: [954, 644, 1175, 1127], third: [1031, 621, 1254, 1111], fourth: [855, 612, 1076, 1083] },
        'D3': { first: [817, 300, 1006, 615], second: [954, 312, 1142, 622], third: [1031, 289, 1221, 601], fourth: [854, 282, 1044, 590] },
        'D4': { first: [817, 300, 1006, 615], second: [954, 312, 1142, 622], third: [1031, 289, 1221, 601], fourth: [854, 282, 1044, 590] },
        'E01': { first: [1079, 635, 1406, 1145], second: [1217, 644, 1542, 1155], third: [1295, 622, 1623, 1139], fourth: [1119, 612, 1440, 1111] },
        'E02': { first: [1085, 287, 1262, 647], second: [1221, 297, 1398, 656], third: [1295, 271, 1484, 599], fourth: [1118, 260, 1306, 589] },
        'HA': { street: [14, 110, 272, 289] },
        'HD': { street: [1069, 9, 1310, 228] },
        /* build 155: the sheet's "ST", Street level as one building (Main Marks Development, 11 Nov 2026):
           the street-level drawing cut around its own shops, worked out from their outlines each time
           (js/lineflow.js floorPlate), every shop glowing. The offer still draws the shop's block. */
        'ST': { street: 'units' }
      },

      /* THE CUT PICTURES (2026-11-03): each one Main Marks' ORIGINAL drawing, baked to EXACTLY its box in
         `plates` at 6x (2400 px at most on the long side) by scripts/make-plates.js. Nothing is redrawn or
         sharpened: the AI-sharpened E02 and A pictures of builds 77 and 98 are gone with it. */
      plateImgs: {
        'A': { first: 'img/moray-plate-A-first.webp', second: 'img/moray-plate-A-second.webp', third: 'img/moray-plate-A-third.webp', fourth: 'img/moray-plate-A-fourth.webp', street: 'img/moray-plate-A-street.webp' },        'A01': { first: 'img/moray-plate-A01-first.webp', second: 'img/moray-plate-A01-second.webp', third: 'img/moray-plate-A01-third.webp', fourth: 'img/moray-plate-A01-fourth.webp', street: 'img/moray-plate-A01-street.webp' },
        'B1': { first: 'img/moray-plate-B1-first.webp', second: 'img/moray-plate-B1-second.webp', third: 'img/moray-plate-B1-third.webp', fourth: 'img/moray-plate-B1-fourth.webp' },
        'B2': { first: 'img/moray-plate-B2-first.webp', second: 'img/moray-plate-B2-second.webp', third: 'img/moray-plate-B2-third.webp', fourth: 'img/moray-plate-B2-fourth.webp' },
        'C1': { first: 'img/moray-plate-C1-first.webp', second: 'img/moray-plate-C1-second.webp', third: 'img/moray-plate-C1-third.webp', street: 'img/moray-plate-C1-street.webp' },
        'C2': { first: 'img/moray-plate-C2-first.webp', second: 'img/moray-plate-C2-second.webp', third: 'img/moray-plate-C2-third.webp', street: 'img/moray-plate-C2-street.webp' },
        'D1': { first: 'img/moray-plate-D1-D2-first.webp', second: 'img/moray-plate-D1-D2-second.webp', third: 'img/moray-plate-D1-D2-third.webp', fourth: 'img/moray-plate-D1-D2-fourth.webp' },
        'D2': { first: 'img/moray-plate-D1-D2-first.webp', second: 'img/moray-plate-D1-D2-second.webp', third: 'img/moray-plate-D1-D2-third.webp', fourth: 'img/moray-plate-D1-D2-fourth.webp' },
        'D3': { first: 'img/moray-plate-D3-D4-first.webp', second: 'img/moray-plate-D3-D4-second.webp', third: 'img/moray-plate-D3-D4-third.webp', fourth: 'img/moray-plate-D3-D4-fourth.webp' },
        'D4': { first: 'img/moray-plate-D3-D4-first.webp', second: 'img/moray-plate-D3-D4-second.webp', third: 'img/moray-plate-D3-D4-third.webp', fourth: 'img/moray-plate-D3-D4-fourth.webp' },
        'E01': { first: 'img/moray-plate-E01-first.webp', second: 'img/moray-plate-E01-second.webp', third: 'img/moray-plate-E01-third.webp', fourth: 'img/moray-plate-E01-fourth.webp' },
        'E02': { first: 'img/moray-plate-E02-first.webp', second: 'img/moray-plate-E02-second.webp', third: 'img/moray-plate-E02-third.webp', fourth: 'img/moray-plate-E02-fourth.webp' },
        'HA': { street: 'img/moray-plate-HA-street.webp' },
        'HD': { street: 'img/moray-plate-HD-street.webp' }
      },

      /* The clinic offer PDF (js/pdf.js, build 78). Muhanad, 2026-10-02: "the
         first floor in moray wellness only". A unit outside `scope` gets no
         offer, whatever the page asks. `art` = PDF-ready copies (jsPDF takes
         PNG/JPEG only): logos rasterised from the CI vectors at 1400 px; the
         drawings flattened from the WebP files above, nothing redrawn. */
      /* build 90: the WhatsApp post (js/post.js). `sample` stamps the picture
         and opens the caption with a SAMPLE line, as the PDF is stamped.
         build 153: OFF, and it switches the PDF's stamp, pill and "sample for
         review" footer too (js/pdf.js). Every term is now Muhanad's answer
         (2026-11-05); his pick by button: "Remove the stamp". */
      post: { sample: false },
      offer: {
        /* build 126: the second floor of Building E is in (Muhanad, 2026-10-07: "finalize Moray Wellness building E").
           A floor is in scope when it has all three: its plan and its building plate below (`art`), and its
           units traced (`unitShapes`).
           2026-11-04, EVERY LINE (Muhanad: "we need to have all the pdfs offers and the whatsapp posts"): clinics,
           offices (1st to 3rd floor), The Fourth and the shops, in every building and on every floor that has its
           drawing. Each line wears its own CI (`lines` below). A unit gets a PDF and a picture only when its
           drawing, its traced outline and its place on the master plan are all there (js/pdf.js can()). */
        scope: { types: ['Clinic', 'Admin', 'Commercial'], floors: ['street', 'first', 'second', 'third', 'fourth'] },
        /* FAIL CLOSED: a unit whose drawing prints a size the app does not print goes as text only. Empty since
           2026-11-05: the 13 fourth-floor units listed here (the 28 Oct plan against the sheet) now take the
           plan's size, which Muhanad says is the right one (inventory `planAreas`). */
        drawingDiffers: [],
        art: {
          mainMarks:  'img/mainmarks-wordmark.png',
          /* build 155: the wordmark in black for the white pages' footer (Main Marks' offer design), painted from the SVG */
          mainMarksBlack: 'img/pdf/mainmarks-black.png',
          morayWhite: 'img/pdf/moray-white.png',
          /* JPEGs (jsPDF takes no WebP) made from Main Marks' original plans by scripts/make-pdf-art.js
             (2026-11-03; every building and floor 2026-11-04): the plan in its frame at 1x, flattened on white
             (pdf.js and post.js scale the outlines by its own pixel size, so it stays 1x); each cut 1600 px on
             its long side (E02's first and second floor at the size they always had). D1 and D2 share one
             cut, as D3 and D4 do (`plateImgs`). */
          plates: {
            'A':   { first: 'img/pdf/plate-A-first.jpg', second: 'img/pdf/plate-A-second.jpg', third: 'img/pdf/plate-A-third.jpg', fourth: 'img/pdf/plate-A-fourth.jpg', street: 'img/pdf/plate-A-street.jpg' },            'A01': { first: 'img/pdf/plate-A01-first.jpg', second: 'img/pdf/plate-A01-second.jpg', third: 'img/pdf/plate-A01-third.jpg', fourth: 'img/pdf/plate-A01-fourth.jpg', street: 'img/pdf/plate-A01-street.jpg' },
            'B1':  { first: 'img/pdf/plate-B1-first.jpg', second: 'img/pdf/plate-B1-second.jpg', third: 'img/pdf/plate-B1-third.jpg', fourth: 'img/pdf/plate-B1-fourth.jpg' },
            'B2':  { first: 'img/pdf/plate-B2-first.jpg', second: 'img/pdf/plate-B2-second.jpg', third: 'img/pdf/plate-B2-third.jpg', fourth: 'img/pdf/plate-B2-fourth.jpg' },
            'C1':  { first: 'img/pdf/plate-C1-first.jpg', second: 'img/pdf/plate-C1-second.jpg', third: 'img/pdf/plate-C1-third.jpg', street: 'img/pdf/plate-C1-street.jpg' },
            'C2':  { first: 'img/pdf/plate-C2-first.jpg', second: 'img/pdf/plate-C2-second.jpg', third: 'img/pdf/plate-C2-third.jpg', street: 'img/pdf/plate-C2-street.jpg' },
            'D1':  { first: 'img/pdf/plate-D1-D2-first.jpg', second: 'img/pdf/plate-D1-D2-second.jpg', third: 'img/pdf/plate-D1-D2-third.jpg', fourth: 'img/pdf/plate-D1-D2-fourth.jpg' },
            'D2':  { first: 'img/pdf/plate-D1-D2-first.jpg', second: 'img/pdf/plate-D1-D2-second.jpg', third: 'img/pdf/plate-D1-D2-third.jpg', fourth: 'img/pdf/plate-D1-D2-fourth.jpg' },
            'D3':  { first: 'img/pdf/plate-D3-D4-first.jpg', second: 'img/pdf/plate-D3-D4-second.jpg', third: 'img/pdf/plate-D3-D4-third.jpg', fourth: 'img/pdf/plate-D3-D4-fourth.jpg' },
            'D4':  { first: 'img/pdf/plate-D3-D4-first.jpg', second: 'img/pdf/plate-D3-D4-second.jpg', third: 'img/pdf/plate-D3-D4-third.jpg', fourth: 'img/pdf/plate-D3-D4-fourth.jpg' },
            'E01': { first: 'img/pdf/plate-E01-first.jpg', second: 'img/pdf/plate-E01-second.jpg', third: 'img/pdf/plate-E01-third.jpg', fourth: 'img/pdf/plate-E01-fourth.jpg' },
            'E02': { first: 'img/pdf/plate-E02-first.jpg', second: 'img/pdf/plate-E02-second.jpg', third: 'img/pdf/plate-E02-third.jpg', fourth: 'img/pdf/plate-E02-fourth.jpg' },
            'HA':  { street: 'img/pdf/plate-HA-street.jpg' },
            'HD':  { street: 'img/pdf/plate-HD-street.jpg' }
          },
          floors:     { street: 'img/pdf/plan-street.jpg', first: 'img/pdf/plan-first.jpg', second: 'img/pdf/plan-second.jpg',
                        third: 'img/pdf/plan-third.jpg', fourth: 'img/pdf/plan-fourth.jpg' },
          /* build 195 (Muhanad, 24 Nov 2026: the key plan "has a black background we need to remove this black
             background and have it as a png"): the offer PDF's key plan ("On the second floor") is a PNG whose
             outside is SEE-THROUGH, made from the app's own floor picture (img/moray-plan-<floor>.webp keeps the
             site outline as transparency; a JPEG cannot, so its outside was black). Same pixel size as the JPEG,
             so every box and dot drawn on it lands where it did. The WhatsApp picture (js/post.js) keeps
             `floors` above, unchanged. Made by scripts/make-plan-png.js (sharp: webp -> resize -> png). */
          floorsPdf:  { street: 'img/pdf/plan-street.png', first: 'img/pdf/plan-first.png', second: 'img/pdf/plan-second.png',
                        third: 'img/pdf/plan-third.png', fourth: 'img/pdf/plan-fourth.png' },
          /* build 79: the project. Every render is Main Marks' own,
             copied out of the Moray brochure with pdfimages -j, NOT re-encoded. */
          /* build 155: the day render of the North 90 front, from Main Marks' design notes (11 Nov 2026), as their
             own offer page places it (it was the brochure's PDF p.12 render, img/moray-render.jpg) */
          street:     'img/pdf/render-day-2026-11.jpg',
          /* build 155: their map of where Moray is, cut from their own offer page design (11 Nov 2026) until
             the original file comes; and Moray's wordmark for the project page */
          map:        'img/pdf/moray-location-map.jpg',
          morayLogo:  'img/pdf/moray-charcoal.png',
          plaza:      'img/pdf/render-p26-plaza.jpg',         /* PDF p.26 "The Grand Central Plaza" */
          sky:        'img/pdf/render-p25-sky.jpg',           /* PDF p.25 "Sky Lounges" */
          master:     'img/pdf/master-p17.jpg'                /* PDF p.17, flattened on white */
        },
        /* EACH LINE'S OWN OFFER (2026-11-04): its CI (`brand`, the colours and type in js/pdf.js), the cover picture,
           its logos (rasterised from the CI vectors at 1400 px), and page 3's two pictures and quote, each the
           brochure's own words on the same subject. Every picture is Main Marks' own: copied out of its
           brochure with pdfimages -j, not re-encoded, or the CI's placed image. The Arabic quotes are OUR
           translations (there is no Arabic brochure), marked so on the page, to be read by an Arabic reader.
           Commercial and offices have no CI of their own: they are Moray, so they wear the Moray CI
           (02 Brand & CI\Moray - CI.pdf: charcoal 323031, orange fa6126, Manrope). */
        lines: {
          wellness: {
            brand: 'wellness', name: 'Moray Wellness', nameAr: 'Moray Wellness',
            /* build 179 (Muhanad, 19 Nov 2026: "the image in the first page in the pdf should match the image in the
               card type"): the card's own photo (Wellness brand book p.4; Main Marks supplied it only at 320 x 480,
               so it prints soft until they send the full-size file). It was the CI p.10 render,
               img/moray-line-wellness-render.jpg. `coverFy`: the part of this tall photo the wide cover shows. */
            /* build 181 (Muhanad, 19 Nov 2026: "the image in the first page need to be the image in the card in the same
               way it is zoomed in now"): the cover draws the card's own frame (card.frame: white, the photo, the teal
               panels) and the photo at the card's zoom: its whole height. `coverPhotoW`: the photo's width over its
               height on the card, measured on a 390 px phone (138.8 x 254.5 px). coverFy is no longer used here. */
            cover:     'img/pdf/cover-wellness.jpg', coverPhotoW: 0.545,   /* the card photo re-saved plain (PDF-safe) */
            logoCover: 'img/pdf/wellness-white.png',              /* CI p.11 */
            logoPage:  'img/pdf/wellness-orange.png',             /* CI p.11 */
            /* build 196 (Muhanad, 24 Nov 2026, the Wellness WhatsApp picture beside the Offices one: "the logo ... is in
               orange we need it to be the same color as the second image"): the WhatsApp picture's logo in Moray's
               charcoal rgb(50,48,49), the colour MORAY wears there (moray-charcoal.png). The file is wellness-orange.png
               with only its colour changed (same pixels, same edges). The PDF pages keep logoPage (not asked). */
            logoPost:  'img/pdf/wellness-charcoal.png',
            rooms: { title: 'Medical Spaces', titleAr: 'المساحات الطبية', doc: 'Moray brochure', docAr: 'كتيب Moray',
                     a: { img: 'img/pdf/render-p37-clinic.jpg', page: 37, fy: 0.5 }, b: { img: 'img/pdf/render-p37-corridor.jpg', page: 37, fy: 0.42 } },
            quote: 'Moray’s medical clinics bring together advanced facilities and refined design, offering trusted care in a setting that prioritizes comfort, accessibility, and community well-being.',
            quoteAr: 'تجمع عيادات Moray الطبية بين المرافق المتطورة والتصميم الراقي، لتقدم رعاية موثوقة في مكان يضع الراحة وسهولة الوصول ورفاهية المجتمع في المقدمة.',
            quotePage: 37
          },
          admin: {
            brand: 'moray', name: 'Moray administrative spaces', nameAr: 'المساحات الإدارية في Moray',
            /* build 179: the card's own photo (from Main Marks' sales app.pdf p.4 mock, only 454 x 443 there and in no
               brochure, so it prints soft until they send the full-size render). It was Moray brochure p.36,
               img/moray-line-admin.jpg. */
            cover:     'img/pdf/cover-admin.jpg', coverFy: 0.5,   /* the card photo re-saved plain: the original drew as stripes in the PDF */
            logoCover: 'img/pdf/moray-white.png',                 /* Moray CI p.18 */
            logoPage:  'img/pdf/moray-charcoal.png',
            rooms: { title: 'Administrative spaces', titleAr: 'المساحات الإدارية', doc: 'Moray brochure', docAr: 'كتيب Moray',
                     a: { img: 'img/pdf/render-p35-office.jpg', page: 35, fy: 0.5 }, b: { img: 'img/pdf/render-p32-interior.jpg', page: 32, fy: 0.5 } },
            quote: 'Envision your business accelerating within workspaces designed not just for productivity, but for profound impact and growth.',
            quoteAr: 'تخيّل أعمالك تنطلق في مساحات عمل لم تُصمَّم للإنتاجية فقط، بل لأثر عميق ونمو حقيقي.',
            quotePage: 35
          },
          fourth: {
            brand: 'fourth', name: 'The Fourth', nameAr: 'The Fourth',
            /* build 155: Main Marks' own picture for The Fourth (their footage of 11 Nov 2026), re-written through the
               browser so a PDF reader draws it (playbook 04, 14p); it was the CI p.20 master photograph */
            cover:     'img/pdf/cover-fourth.jpg',
            logoCover: 'img/pdf/fourth-white.png',                /* the client's logos-02.svg, reversed (CI p.18) */
            logoPage:  'img/pdf/fourth-black.png',                /* "Use the black logo on white", CI p.18 */
            rooms: { title: 'Interior shots', titleAr: 'من الداخل', doc: 'The Fourth brochure', docAr: 'كتيب The Fourth',
                     a: { img: 'img/pdf/fourth-p19-lobby.jpg', page: 19, fy: 0.5 }, b: { img: 'img/pdf/fourth-p20-office.jpg', page: 20, fy: 0.5 } },
            quote: 'Its elevated position opens the workplace to views across Moray, with an open outlook toward North 90 and selected views overlooking the project’s landscaped plaza.',
            quoteAr: 'يفتح موقعها المرتفع مكان العمل على إطلالات عبر Moray، بإطلالة مفتوحة على شارع التسعين الشمالي، وإطلالات مختارة على الساحة المنسقة للمشروع.',
            quotePage: 10
          },
          commercial: {
            brand: 'moray', name: 'Moray commercial units', nameAr: 'الوحدات التجارية في Moray',
            /* build 155: Main Marks' own sketch for the commercial units (their footage of 11 Nov 2026, Asset 1@4x.png),
               re-written through the browser; it was the brochure's p.29 picture */
            cover:     'img/pdf/cover-commercial.jpg',
            /* build 156: the brand book's lockup (Moray Commercial Guidelines p.12), in its cream #F7F0E6, painted to
               PNG through the browser from img/moray-commercial-one-address.svg; their offer cover, sales app.pdf p.6 */
            script:    'img/pdf/commercial-one-address-cream.png',
            logoCover: 'img/pdf/moray-white.png',
            logoPage:  'img/pdf/moray-charcoal.png',
            rooms: { title: 'Beyond shopping', titleAr: 'أكثر من تسوق', doc: 'Moray brochure', docAr: 'كتيب Moray',
                     a: { img: 'img/pdf/render-p28-commercial.jpg', page: 28, fy: 0.5 }, b: { img: 'img/pdf/render-p29-commercial.jpg', page: 29, fy: 0.45 } },
            quote: 'Discover an eclectic mix of refined retail, charming cafes, and exquisite dining that transforms every stroll into an experience, fostering organic connections and dynamic urban life.',
            quoteAr: 'اكتشف مزيجاً متنوعاً من متاجر راقية ومقاهٍ ساحرة ومطاعم مميزة، يحوّل كل جولة إلى تجربة، ويصنع روابط طبيعية وحياة حضرية نابضة.',
            quotePage: 28
          }
        },
        /* The master plan (p.17) and the first-floor plan (p.20) are the same site
           drawn at slightly different scales. Lined up by their site outlines
           (alpha masks, overlap 99.2%): master px = s * first-floor px + (tx, ty).
           So a building cut on the floor plan (`plates`) is found on the master plan. */
        /* build 126: the fit was measured on the FIRST-floor drawing (`floor`). Another floor's drawing sits
           on a different canvas, so a building is found on the master plan through its first-floor cut:
           the same building, the same size, at that drawing's own offset (js/pdf.js, js/post.js). */
        masterFromFloor: { s: 0.98989, tx: 16.04, ty: 16.16, floor: 'first' },
        /* 2026-11-04: a building with NO cut on that floor (the back-row block HA, whose shops are on the street
           level) is found through a fit of ITS floor's drawing to the master plan, measured the same way: the
           two site outlines lined up (overlap 99.4%; the same method gives the first floor within 2 px of the
           fit above). master px = s * street px + (tx, ty). */
        masterFits: { street: { s: 0.99986, tx: 11.59, ty: 24.03 } },
        /* The project in the brochure's own figures and words (PDF p.14) */
        /* `smallAr` (build 80): there is NO Arabic Moray
           brochure, so these are OUR translations of its English, marked as such
           on the page, to be checked by an Arabic reader before real use */
        facts: [
          { big: '70,000 m²', small: 'about 17 feddans', smallAr: 'نحو 17 فداناً' },
          { big: '14', small: 'buildings: 2 for clinics, 8 for offices, 4 serviced apartments',
            smallAr: 'مبنى: 2 للعيادات، 8 للمكاتب، 4 شقق فندقية' },
          { big: '10', small: 'entrances, 3 of them grand gates on North 90th St.',
            smallAr: 'مداخل، منها 3 بوابات رئيسية على شارع التسعين الشمالي' }
        ],
        factsPage: 14
      },

      /* UNIT OUTLINES (2026-11-03): every unit printed on Main Marks' original drawings of the street level
         and the 1st to 4th floors, 798 in all, in the floor's frame (the same space as `plates`).
         TRACED BY MACHINE, NOT BY HAND (scripts/trace-floor.js): each unit code read off the drawing (read
         three times; the majority kept), the room filled out from its label to its walls. Its EDGE re-drawn
         (scripts/refine-outlines.js, 2026-11-04) down the middle of every wall, straight through columns
         and across doorways, door swings inside. Checked (scripts/make-config.js report): every room's size
         against the m2 printed in it (all 92 sheet units between 0.89 and 1.03 of the floor's px per m2;
         before the re-draw 0.88 to 1.10), no two outlines overlapping by more than a few px, and each of
         the 92 sheet units looked at, outline on the drawing. Replaces Muhanad's hand tracing of E (1st,
         2nd), which the machine outlines agree with (median overlap 0.92) and fit the sharp drawing better.
         LABEL READ BY EYE (no machine reading took it; the outline is still the machine's fill from a point
         its own sweep found inside the room): ST03F, D4-208, A441A, A444B.
         LEFT OUT: a unit whose letter was not read (ST01 on the street, beside ST01 (C) to (F); A432 on the
         4th, beside A432 (A) and (B)). Step 3 draws an outline only when the sheet has that code, so a unit
         Main Marks adds later opens by itself. Re-make, never edit by hand.
         THEY LIVE IN js/unit-shapes.js (about 290 KB, 77 KB as sent), loaded by project.html and demo.html only, so the
         sign-in and manager pages do not carry them; that file fills this object. */
      unitShapes: {},

      /* --- Inventory: Main Marks' OWN sheet (build 68) -------------------
         Main Marks Inventory.xlsx, tab "Moray", exported by
         scripts/moray-inventory.js with the sheet's own headings. When the
         sheet is on Google Drive, `url` becomes
           https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv
         and nothing else changes. Everything the pages show — lines,
         buildings, floors, counts, sizes, prices — is DERIVED from these
         rows, so a unit added to the sheet appears on its own. */
      inventory: {
        url: 'data/moray-inventory.csv',
        /* LIVE READER (2026-11-18): Main Marks' IT gave a read-only key to their SharePoint site
           "Moray Inventory" (Sites.Selected). The reader is Main Marks Store/functions/moray-inventory,
           checked on this laptop against the real file (tests/moray-inventory-check.mjs, all passed).
           ON SINCE 18 Nov 2026: deployed on Supabase "Main Marks" (function moray-inventory v1), four
           MM_ secrets saved, table mm_inventory_live + pg_cron job "moray-inventory-every-minute".
           A signed-in copy reads ONLY the reader (no fall-back to `url`). The demo (no store block)
           keeps reading `url`. */
        live: 'moray-inventory',
        demo: false,
        source: 'Moray Availability updated.xlsx (Nehal Ismail, 17 Nov 2026; tabs Inventory + Commercial)',
        /* 17 Nov 2026: the sheet files three clinics (A235A, A236B, A337A) under Bldg "A02"; their traced
           outlines sit in block "A" (A2) on Main Marks' drawings, where the sheet's other clinics are. Read as
           "A" everywhere (js/inventory.js), so A2 stays ONE building in every list, plate and offer. */
        sameBuilding: { 'A02': 'A' },
        /* THE FOURTH FLOOR'S SIZES ARE THE PLAN'S (Muhanad, 2026-11-05: "On the 28 October fourth-floor plan
           (this is the most updated one so this is what is right)"). Main Marks' plan of 28 Oct 2026 prints a
           size for these 18 units (2 of them on hold) that is not the sheet's; each is read off the plan
           (tools/floor-traces/report.txt, and by eye on the drawing). `was` is the sheet's figure it replaces:
           the plan's size is used only while the sheet still says `was`, so the day Main Marks corrects the
           sheet, or writes any other figure, the sheet speaks again (js/inventory.js). THE PRICE IS STILL THE
           SHEET'S, and it was set on the old size (its price per m2 matches the neighbours only on the old
           size): asked of Main Marks. */
        planAreas: {
          'A408': { m2: 67, was: 69 }, 'A409': { m2: 67, was: 70 }, 'A414': { m2: 67, was: 70 }, 'A415': { m2: 67, was: 70 },
          'A440A': { m2: 86, was: 82 }, 'A440B': { m2: 83, was: 82 }, 'A441A': { m2: 83, was: 80 }, 'A441B': { m2: 83, was: 80 },
          'A444A': { m2: 82, was: 80 }, 'A444B': { m2: 84, was: 80 }, 'A445': { m2: 225, was: 213 },
          'D3-404': { m2: 49, was: 48 }, 'D3-405': { m2: 49, was: 48 }, 'D3-409': { m2: 44, was: 48 },
          'D4-405': { m2: 49, was: 48 }, 'D4-408': { m2: 46, was: 50 }, 'D4-412': { m2: 44, was: 48 }, 'D4-413': { m2: 44, was: 48 }
        },
        /* the sheet's own headings -> the reader's fields */
        columns: {
          code:      ['Unit No.2', 'Unit No.', 'Unit No', 'Unit Code'],
          building:  ['Bldg', 'Building'],
          floor:     ['Floor'],
          type:      ['Type'],
          area:      ['BUA'],
          listPrice: ['Live unit price', 'Live unit price ']
        },
        required: ['code', 'building', 'floor', 'type', 'area', 'listPrice', 'status']
      },

      /* --- Payment plans: Yostina Gamil, 29 Sep 2026 -------------------
         (05 Sales & pricing\Payment Plans & Current Offer.txt).
         Every instalment is QUARTERLY — Main Marks' own sample contract
         (D1-205 Contract Payment.xlsx: 10% down + 32 quarterly over 8
         years), which js/plans.js reproduces to the pound.
         `discount` is the plan's own; the price it applies to is the
         sheet's live price. `until` ends the offer by itself: after that
         date the plan is not offered at all. `notFor` = unit types the
         plan does not apply to ("does NOT apply to commercial units").
         build 141: A PLAN STAYS IN THIS LIST AFTER ITS `until` HAS PASSED. The offer pages stop
         showing it by themselves; the contract form (MM.contractPlan, js/auth.js) still lists it,
         because a contract can be signed later on a reservation made during the offer (Muhanad,
         2026-10-11). And an `id` is never given to a different plan later: contracts are saved
         under it.
         THE PLANS OF 2 NOV 2026 (Yossef Walid's email of that day, "the current payment plans for both
         Moray and h:rs"; he also wrote that the October offer ended on 15 Oct and was not extended):
         10% down over 8 years; 5% over 7; 10% over 7 with 5% off; 5% over 6 with 5% off; 10% over 6 with
         10% off; 2.5% + 2.5% after 3 months over 5 years with 10% off; 7.5% + 7.5% after 3 months over
         5 years with 15% off; 40% off for cash. So 0% over 6 and 10% over 6 (no discount), which his list
         no longer names, end on the day he wrote.
         MUHANAD'S ANSWERS, 2026-11-05: "the cash discount is on all units" (shops too); in the two split
         plans "the instalment start 3 month from the first payment which is the same date of the second
         bulk payment" (a `down` milestone at month 3, the first instalment at month 3, 20 over 5 years);
         "the downpayment is from the original price before discount and the discount is from the original
         price as well" (terms.downOn 'list'). SHOPS TOO, build 152: asked whether the instalment plans with
         a discount also apply to commercial units, Muhanad picked "Yes, all plans" (2026-11-05). So no
         current plan carries `notFor`.
         ONLY THE CURRENT PLANS, build 153 (Muhanad, 2026-11-05: "remove the older payment plan only keep
         the new ones"): the October offer (o0-8, o20-8, o30-10, o10-3) and 0% / 10% over 6 (p0-6, p10-6)
         are off the list, the contract form's too. A contract already saved on one of them still reads
         by its own two numbers (MM.contractPlan.text), and those ids are never given to another plan. */
      plans: [
        { id: 'p10-8', group: 'original', label: '10% down · 8 years',            down: 0.10, years: 8,  every: 3 },
        { id: 'p5-7',  group: 'original', label: '5% down · 7 years',             down: 0.05, years: 7,  every: 3 },
        { id: 'p10-7-off5',  group: 'original', label: '10% down · 7 years · 5% off',  down: 0.10, years: 7, every: 3, discount: 0.05 },
        { id: 'p5-6-off5',   group: 'original', label: '5% down · 6 years · 5% off',   down: 0.05, years: 6, every: 3, discount: 0.05 },
        { id: 'p10-6-off10', group: 'original', label: '10% down · 6 years · 10% off', down: 0.10, years: 6, every: 3, discount: 0.10 },
        { id: 'p5s-5-off10',  group: 'original', label: '2.5% + 2.5% down · 5 years · 10% off', down: 0.025, years: 5, every: 3, discount: 0.10,
          milestones: [{ pct: 0.025, months: 3, label: 'Second down payment', down: true }] },
        { id: 'p15s-5-off15', group: 'original', label: '7.5% + 7.5% down · 5 years · 15% off', down: 0.075, years: 5, every: 3, discount: 0.15,
          milestones: [{ pct: 0.075, months: 3, label: 'Second down payment', down: true }] },
        /* the October offer's spot cash (40% off) is the same plan as the 2 Nov one: the same id, no end date
           now, and on every unit (Muhanad, 2026-11-05) */
        { id: 'cash',  group: 'original', label: 'Spot cash · 40% off',           cash: true, discount: 0.40 }
      ],
      planGroups: { original: 'Standard plans' },
      /* BUILD 155: MAIN MARKS' OWN ANSWERS, 11 Nov 2026 (Yossef Walid's email "Sales App Comments and
         requrmints", Operations Department). They replace Muhanad's answers of 5 Nov on these three points. */
      terms: {
        instalmentEvery: 3,
        /* "Down payments must be calculated based on the discounted price, not the original price."
           (was 'list' on Muhanad's answer of 5 Nov). The discount itself is still on the original price. */
        downOn: 'discounted',
        /* "Delivery dates: A1 & B1: 2 years. A2, B2 & D: 3 years. E: 4 years.", counted from the contract
           date as before. By block (config `buildings` ids): js/plans.js termsFor() gives each unit its own;
           a shop takes the block above it. NOT GIVEN, so not printed: C1, C2 and HA to HD (the shops under
           HA today); the offer says the date is to be confirmed. */
        deliveryByBuilding: { 'A1': 24, 'B1': 24, 'A2': 36, 'B2': 36, 'D1-D2': 36, 'D3-D4': 36, 'E1': 48, 'E2': 48 },
        deliveryMonths: null,
        /* "Maintenance fees should not appear in the sales offer." (Admin & Clinics 3$/M, Commercial 5$/M,
           as they wrote it: a running fee, not the 8% deposit of build 153). Nothing prints it. */
        maintenance: null,
        /* NOT SUPPLIED, so NOT SHOWN: club or other fees */
        extras: []
      },
      /* 2026-11-05: nothing is assumed any more (the down payment's base, the first instalment's date,
         maintenance and delivery are all Muhanad's answers), so the PDF has no "Assumed" box */
      assumptions: [],
      /* Main Marks' brokerage companies: ALL 76, from their own list
         (Desktop\Moray - Main Marks\05 Sales & pricing\Broker company.xlsx, rows 1-76,
         in their order and spelling; only stray spaces tidied). Feeds "Who is this
         offer for?" (build 88; Muhanad: "add all the brokerage company list").
         NEVER PUBLISHED AS IT STANDS HERE (Muhanad, 2026-10-07, "hide on both": the
         contract promises the broker list is never disclosed, and a published file is
         readable without signing in). The publish scripts cut this list between the two
         markers: the real app takes the companies from the store after sign-in. */
      brokerages: /* on the real app the companies are in the store, read after sign-in */ [],
      source:  'Moray brochure (Digital Brochure, Oct 2025)',

      /* OPEN. Moray is the project the contract buys, so it is the live
         card — it opens on everything the brochure supports. Selling
         (units, schedule, offer) waits on the inventory and the plans. */
      ready:   true
    }
  ],

  /* --- Who may sign in ------------------------------------------------
     DEMO ACCOUNTS. Main Marks has not sent its sales team yet (their
     Priority 3). These are placeholders so the app can be used and shown;
     they are obviously not real people, on purpose — a made-up name that
     looks real would end up printed on an offer.

     When the real team arrives this list is replaced, and when the back
     end is stood up this list goes away entirely and js/auth.js talks to
     it instead. Nothing else changes: every screen reads the session, not
     this array.

     Sign-in is by WORK EMAIL, which is what the sales team already has
     and already remembers. The addresses below are deliberately at
     `demo.local` — an address that cannot exist — so a placeholder can
     never be mistaken for somebody's real account. The name is accepted
     too, because a salesperson handed a phone will type that.        */
  /* no demo accounts on the real app: people sign in from the store */
  users: [],
  usersDemo: false,

  /* THE MANAGER VIEW'S TEAM (manager.html). One real team out of Main Marks'
     own structure (Desktop\Moray - Main Marks\05 Sales & pricing\New Sales
     Structure.xlsx, read 2026-10-05): one sales manager and the seven people
     under him. The demo manager account above signs in as him. Assistant managers
     and supervisors are sellers with a higher title: no extra rights.
     REAL NAMES AND STAFF CODES. scripts/make-demo-publish.js cuts everything
     between the two markers out of the public copy unless it is run with
     --manager=real, and refuses to finish if a name or code is still in it.
     Ask Muhanad before real names go on a public link. Without this block the
     app has no manager view: sign-in and the header check for it. */
  /* the team is in the store, not in this file */

  roles: {
    sales:         { label: 'Sales agent',   canOffer: true,  canSeeTeam: false, canSeeAll: false },
    sales_manager: { label: 'Sales manager', canOffer: true,  canSeeTeam: true,  canSeeAll: false },
    director:      { label: 'Director',      canOffer: true,  canSeeTeam: true,  canSeeAll: true },
    /* build 154: the Chief Commercial Officer, an account the admin can make on the demo (js/admin-demo.js);
       his screens are not built. He sees every team. */
    cco:           { label: 'CCO',           canOffer: false, canSeeTeam: true,  canSeeAll: true },
    /* build 123: the admin looks after the accounts and the company list (admin.html). He does not send
       offers. Build 154: a demo admin keeps the payment plans on a demo link (js/planbook.js). */
    admin:         { label: 'Admin',         canOffer: false, canSeeTeam: false, canSeeAll: true }
  }
};

if (typeof module === 'object' && module.exports) module.exports = CONFIG;
