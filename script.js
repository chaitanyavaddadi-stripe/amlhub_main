document.addEventListener('DOMContentLoaded', function() {
    // --- VANTA.JS GLOBE EFFECT ---
    let vantaEffect = null;
    
    function initVantaEffect() {
        if (vantaEffect) {
            vantaEffect.destroy();
        }
        
        const isLightMode = document.documentElement.classList.contains('light');
        const globeEl = document.getElementById('vanta-globe');
        
        if (!globeEl) return;
        
        // Configure the globe effect
        vantaEffect = VANTA.GLOBE({
            el: globeEl,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xff3f81, // Pink color always
            color2: isLightMode ? 0x23153c : 0xffffff, // Dark purple/white color
            backgroundColor: isLightMode ? 0xffffff : 0x23153c, // Light/dark background
            size: 1.20,
            speed: 0.80,
            points: isLightMode ? 8.00 : 10.00, // Fewer points in light mode
            maxDistance: isLightMode ? 20.00 : 25.00 // Shorter connections in light mode
        });
    }
    
    // --- THEME TOGGLE ---
    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        themeToggle.addEventListener('click', () => {
            // Toggle light/dark classes on html element
            if (document.documentElement.classList.contains('light')) {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
                localStorage.theme = 'dark';
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                localStorage.theme = 'light';
            }
            
            // Update particle colors if the canvas exists
            updateParticleColors();
            
            // Reinitialize Vanta effect with new colors
            initVantaEffect();
        });
    }
    
    // --- PARTICLE CANVAS BACKGROUND ---
    let particles = [];
    let particleColors = {
        dark: {
            particle: [255, 255, 255],
            connection: [255, 255, 255]
        },
        light: {
            particle: [35, 21, 60], // Dark purple color for better contrast
            connection: [35, 21, 60]
        }
    };
    
    function updateParticleColors() {
        const isLightMode = document.documentElement.classList.contains('light');
        if (particles.length > 0) {
            particles.forEach(particle => {
                particle.color = isLightMode ? particleColors.light.particle : particleColors.dark.particle;
            });
        }
    }
    
    function createParticleBackground() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        // Set canvas size to match window
        canvas.width = width;
        canvas.height = height;
        
        // Track mouse position
        let mouseX = width / 2;
        let mouseY = height / 2;
        let mouseRadius = 150;
        
        // Create particles
        const particleCount = Math.min(Math.floor((width * height) / 9000), 200);
        
        // Find the hero banner position to create more particles around it
        const heroBanner = document.querySelector('.hero-banner-img');
        let heroBannerRect = null;
        
        if (heroBanner) {
            heroBannerRect = heroBanner.getBoundingClientRect();
        }
        
        class Particle {
            constructor(nearBanner = false) {
                if (nearBanner && heroBannerRect) {
                    // Create particles near the banner
                    const margin = 100;
                    this.x = heroBannerRect.left - margin + Math.random() * (heroBannerRect.width + margin * 2);
                    this.y = heroBannerRect.top - margin + Math.random() * (heroBannerRect.height + margin * 2);
                    this.size = Math.random() * 2.5 + 0.8;
                    this.opacity = Math.random() * 0.6 + 0.3;
                } else {
                    // Create particles randomly across the screen
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.size = Math.random() * 2 + 0.5;
                    this.opacity = Math.random() * 0.5 + 0.2;
                }
                
                this.baseSize = this.size;
                const isLightMode = document.documentElement.classList.contains('light');
                this.color = isLightMode ? particleColors.light.particle : particleColors.dark.particle;
                this.speed = {
                    x: (Math.random() - 0.5) * 0.5,
                    y: (Math.random() - 0.5) * 0.5
                };
                this.connections = [];
            }
            
            update() {
                // Move particle
                this.x += this.speed.x;
                this.y += this.speed.y;
                
                // Wrap around edges
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
                
                // React to mouse
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouseRadius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouseRadius - distance) / mouseRadius;
                    
                    // Push particles away from mouse
                    this.x -= Math.cos(angle) * force * 2;
                    this.y -= Math.sin(angle) * force * 2;
                    
                    // Increase size and opacity near mouse
                    this.size = this.baseSize * (1 + force);
                    this.opacity = Math.min(0.8, this.opacity + force * 0.2);
                } else {
                    // Return to base size and opacity
                    this.size = this.baseSize;
                    this.opacity = Math.max(0.2, this.opacity - 0.01);
                }
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`;
                ctx.fill();
            }
            
            connectTo(particle) {
                const dx = this.x - particle.x;
                const dy = this.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Only connect particles within a certain distance
                const maxDistance = width / 10;
                if (distance < maxDistance) {
                    // Check if both particles are near the banner
                    let isNearBanner = false;
                    if (heroBannerRect) {
                        const nearBanner1 = 
                            this.x >= heroBannerRect.left - 100 && 
                            this.x <= heroBannerRect.right + 100 &&
                            this.y >= heroBannerRect.top - 100 && 
                            this.y <= heroBannerRect.bottom + 100;
                            
                        const nearBanner2 = 
                            particle.x >= heroBannerRect.left - 100 && 
                            particle.x <= heroBannerRect.right + 100 &&
                            particle.y >= heroBannerRect.top - 100 && 
                            particle.y <= heroBannerRect.bottom + 100;
                            
                        isNearBanner = nearBanner1 && nearBanner2;
                    }
                    
                    // Calculate opacity based on distance and banner proximity
                    let opacity = 0.2 * (1 - distance / maxDistance);
                    const isLightMode = document.documentElement.classList.contains('light');
                    let color = isLightMode ? particleColors.light.connection : particleColors.dark.connection;
                    
                    // Enhance connections near the banner
                    if (isNearBanner) {
                        opacity *= 1.5;
                        // Add a slight tint to connections near the banner
                        if (isLightMode) {
                            color = [79, 70, 229]; // Indigo for light mode
                        } else {
                            color = [200, 220, 255]; // Light blue for dark mode
                        }
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(particle.x, particle.y);
                    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
                    ctx.lineWidth = isNearBanner ? 0.8 : 0.5;
                    ctx.stroke();
                }
            }
        }
        
        // Create particles
        // First create particles around the banner
        if (heroBannerRect) {
            for (let i = 0; i < particleCount * 0.3; i++) {
                particles.push(new Particle(true));
            }
        }
        
        // Then create particles across the screen
        for (let i = 0; i < particleCount * 0.7; i++) {
            particles.push(new Particle(false));
        }
        
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Handle clicks
        document.addEventListener('click', (e) => {
            // Create ripple effect
            mouseRadius = 300;
            setTimeout(() => {
                mouseRadius = 150;
            }, 500);
            
            // Create new particles at click position
            for (let i = 0; i < 5; i++) {
                const particle = new Particle(false);
                particle.x = e.clientX;
                particle.y = e.clientY;
                particle.opacity = 0.8;
                particle.size = Math.random() * 3 + 1;
                particle.baseSize = particle.size;
                particles.push(particle);
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            
            // Update hero banner rect
            if (heroBanner) {
                heroBannerRect = heroBanner.getBoundingClientRect();
            }
        });
        
        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            
            // Draw connections between particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    particles[i].connectTo(particles[j]);
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

    // --- UTILITY FUNCTIONS ---
    const nameToFilename = (name) => name.toLowerCase().replace(/ /g, '-').replace(/\./g, '') + '.jpg';
    const nameToInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

    // --- TIMELINE ORG CHART ---
    function renderOrgChart() {
        const teamData = {
            name: 'Megha Chhaparia', title: 'AML LOB Lead', image: 'meghachhaparia.jpg', color: '#8b5cf6',
            children: [
                { name: 'Aparna Jayant', title: 'AML EMEA DRI', image: 'ajayant.jpg', color: '#ef4444', reports: ['Agnel Levin', 'Aman Husain', 'Nanda Krishnan U Nair', 'Padma Lochan Choudhury', 'Princy Ann', 'Suman S', 'Vasudevan Sundararaj', 'Yusuf Khan'] },
                { name: 'Divya Nayak', title: 'AML EMEA DRI', image: 'divyanayak.jpg', color: '#3b82f6', reports: ['Ashwini H', 'Bindya Cheruvalanda Lava', 'Geetanjali Gudiseva', 'Lokesh Raaju Polamarasetty', 'Monica Manisha Monteiro', 'Shalini T', 'Surbhi Kumari', 'Swaroop S Kaushik', 'Vaishnavi V', 'Vidya t'] },
                { name: 'Mohit Aditya', title: 'AML APAC DRI & Projects Lead', image: 'mohitaditya.jpg', color: '#22c55e', reports: ['Arshanath Sasidharan Nalini', 'Avinav Chel', 'Chaitanya Vaddadi', 'Hemanth Harish G', 'Manish Kumar Sahu', 'Nabanita Mazumdar', 'Nikita Dsouza', 'Swarnim Taj', 'Vineeth R'] },
                { name: 'Vinayak Shenoy K', title: 'AML US DRI', image: 'vinayaks.jpg', color: '#f97316', reports: ['Aanchal Mutreja', 'Aanya Chhabria', 'Aarush Sharma', 'Aditya Mathur', 'Amitha Mathew', 'Angdeep Sharma', 'Arbaaz Khan', 'Ashik Gem', 'Ekansh Lohani', 'Fateh N Ahmed', 'Gaurav Kumar', 'Gyanesh Chaudhary', 'Jinkala Thrisha', 'KRUTHIKA RAMASWAMY', 'Khushi Khandelwal', 'M Tikendra Singha', 'Mehul Shah', 'Nagaruru Nithya Sai Rachana', 'Nandini Karwa', 'Nikita Kanjilal', 'Nisha Shetty', 'Nitin Vashisth', 'Pallav Makil', 'Pradyumn Gupta', 'Puneeth Balaji T', 'Rebecca Siangshai', 'Sabhya Punjabi', 'Sanchit Maitra', 'Sanjana Kadlaskar', 'Sharib Shams', 'Shashi Mehta', 'Shreeja Dutta', 'Shwetabh Trivedi', 'Sindhu Sampathkumar', 'Sneha Agarwal', 'Srijoni Dasgupta', 'Sriparna Guha Roy', 'Sriram Chandrasekaran', 'Srishti Bhandary', 'Suhasini Satapathy', 'Vibhav Prakash', 'Vignesh R'] }
            ]
        };

        const container = document.getElementById('org-chart-container');
        if (!container) return;

        container.innerHTML = `<div class="timeline-org-chart"></div>`;
        const chart = container.querySelector('.timeline-org-chart');

        const lead = teamData;
        const leadColor = lead.color || '#6b7280';
        const leadProfileLink = `/profiles/${lead.name.toLowerCase().replace(/ /g, '-')}`;
        chart.innerHTML = `
            <div class="timeline-lead">
                <a href="${leadProfileLink}" target="_blank" class="node-card-link" style="text-decoration: none;">
                    <div class="node-card" style="border-color: ${leadColor}; cursor: pointer;">
                        <img src="images/${lead.image || nameToFilename(lead.name)}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/${leadColor.substring(1)}/ffffff?text=${nameToInitials(lead.name)}';">
                        <div class="name">${lead.name}</div>
                        <div class="title" style="color: ${leadColor};">${lead.title}</div>
                    </div>
                </a>
            </div>`;
        
        const timelineBody = document.createElement('div');
        timelineBody.className = 'timeline-body';
        chart.appendChild(timelineBody);

        teamData.children.forEach((manager, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const item = document.createElement('div');
            item.className = `org-timeline-item ${side}`;
            item.style.setProperty('--item-color', manager.color);
            
            const managerColor = manager.color || '#6b7280';

            let reportsHtml = '';
            if (manager.reports && manager.reports.length > 0) {
                reportsHtml = '<ul class="reports-list">';
                manager.reports.forEach(reportName => {
                    const reportProfileLink = `/profiles/${reportName.toLowerCase().replace(/ /g, '-')}`;
                    const reportImage = nameToFilename(reportName);
                    const reportInitials = nameToInitials(reportName);
                    reportsHtml += `
                        <li>
                            <a href="${reportProfileLink}" target="_blank" class="report-item-link">
                                <img src="images/${reportImage}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/e0e0e0/333?text=${reportInitials}';">
                                <span>${reportName}</span>
                            </a>
                        </li>`;
                });
                reportsHtml += '</ul>';
            }

            const managerProfileLink = `/profiles/${manager.name.toLowerCase().replace(/ /g, '-')}`;
            item.innerHTML = `
                <div class="node-card" data-has-reports="${!!reportsHtml}" style="border-color: ${managerColor};">
                    <img src="images/${manager.image || nameToFilename(manager.name)}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/${managerColor.substring(1)}/ffffff?text=${nameToInitials(manager.name)}';">
                    <div class="name">${manager.name}</div>
                    <div class="title" style="color: ${managerColor};">${manager.title}</div>
                    ${reportsHtml}
                </div>`;
            
            timelineBody.appendChild(item);
        });

        chart.querySelectorAll('.node-card').forEach(card => {
            const hasReports = card.dataset.hasReports === 'true';
            if (hasReports) {
                card.addEventListener('click', (e) => {
                    // Prevent link navigation if clicking inside the card to expand
                    if (e.target.closest('a')) return; 
                    card.closest('.org-timeline-item').classList.toggle('expanded');
                });
                // To make the manager card itself a link, we wrap it in an anchor tag conditionally or handle navigation via JS.
                // For simplicity, let's make only reports clickable links, and manager cards expanders.
            } else {
                 // For managers without reports, their card becomes a link
                 const managerName = card.querySelector('.name').textContent;
                 const profileLink = `/profiles/${managerName.toLowerCase().replace(/ /g, '-')}`;
                 card.addEventListener('click', () => {
                     window.open(profileLink, '_blank');
                 });
            }
        });
    }

    // --- HOME PAGE ACCORDION ---
    function renderHomeAccordion() { /* ... content from previous versions ... */ }

    // --- RESOURCES PAGE CONTENT (NOW WITH FULL DETAILS) ---
    function renderResourcesContent() {
        const container = document.getElementById('resources-content');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-md">
                <p class="text-gray-600 leading-relaxed text-lg text-center">
                    As explained on the Global AML home page, Stripe’s Global AML Team works to combat money laundering and terrorist financing. This hub provides explanations of unusual activity, guides for AML referrals, and clarifies what can be shared with users.
                </p>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-md">
                <h3 class="text-2xl font-bold mb-6 text-gray-800 text-center">AML Referrals Overview</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="border-2 border-green-200 bg-green-50 p-6 rounded-lg">
                        <h4 class="font-bold text-lg text-green-700 mb-3 flex items-center"><i class="fas fa-check-circle mr-2"></i>What to Do</h4>
                        <ul class="list-disc list-inside space-y-3 text-green-800">
                            <li>Submit an AML referral to the team at <a href="#" class="font-semibold underline">go/aml-referral</a>.</li>
                            <li>Follow guidance on <a href="#" class="font-semibold underline">go/unusual-activity</a>.</li>
                            <li>Ask for the team’s input via <a href="#" class="font-semibold underline">go/ask/financial-crimes</a>.</li>
                            <li>If you’re not sure, it’s always worth an ask!</li>
                        </ul>
                    </div>
                    <div class="border-2 border-red-200 bg-red-50 p-6 rounded-lg">
                        <h4 class="font-bold text-lg text-red-700 mb-3 flex items-center"><i class="fas fa-times-circle mr-2"></i>What Not to Do</h4>
                        <ul class="list-disc list-inside space-y-3 text-red-800">
                            <li>Tell a user about Stripe Financial Crimes concerns (tipping off).</li>
                            <li>Fail to share any concerns you have with our team.</li>
                            <li>Help users get around our controls.</li>
                            <li>Offer legal or compliance advice to users.</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="border-l-4 border-yellow-500 bg-yellow-50 p-6 rounded-r-lg shadow">
                 <h4 class="font-bold text-lg text-yellow-800 mb-3 flex items-center"><i class="fas fa-exclamation-triangle mr-2"></i>Important Note on "Tipping Off"</h4>
                 <p class="text-yellow-900 mb-4">Disclosing sensitive information could lead to serious civil or criminal penalties. AML teams cannot share investigation outcomes. For help with user-facing language, please contact the AML team.</p>
                 <div class="overflow-x-auto">
                     <table class="min-w-full bg-white rounded-lg">
                        <thead class="bg-yellow-100">
                            <tr>
                                <th class="text-left py-2 px-4 font-semibold text-yellow-900">Country</th>
                                <th class="text-left py-2 px-4 font-semibold text-yellow-900">Potential Fine</th>
                                <th class="text-left py-2 px-4 font-semibold text-yellow-900">Imprisonment</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-700">
                            <tr><td class="border-t py-2 px-4">US</td><td class="border-t py-2 px-4">Up to $100k (civil); $250k (criminal)</td><td class="border-t py-2 px-4">Up to 5 years</td></tr>
                            <tr><td class="border-t py-2 px-4">UK</td><td class="border-t py-2 px-4">Unlimited</td><td class="border-t py-2 px-4">Up to 5 years</td></tr>
                            <tr><td class="border-t py-2 px-4">Ireland</td><td class="border-t py-2 px-4">Up to €5k</td><td class="border-t py-2 px-4">Up to 5 years</td></tr>
                        </tbody>
                     </table>
                 </div>
            </div>
            <div id="resources-accordion-container" class="space-y-4"></div>
        `;

        const accordionData = [
            {
                title: 'Guide to Creating an AML Referral',
                icon: 'fa-file-alt',
                content: `<p class="mb-4 text-gray-600">This section explains how Stripes can raise concerns about accounts with the Global AML teams. Referrals will be directed to the regional teams where accounts are opened. If you’re not sure, always ask.</p>
                    <ol class="list-decimal list-inside space-y-6">
                        <li><h5 class="font-semibold text-gray-800 inline">Navigate and Submit</h5><p class="pl-6 text-gray-600">Go to <a href="#" class="text-indigo-600 font-medium hover:underline">go/aml-referral</a>, select "AML", and input the merchant token and supporting information. This creates a referral under the <code>anti_money_laundering</code> review type in the AML team’s queue.</p></li>
                        <li><h5 class="font-semibold text-gray-800 inline">Draft Your Referral</h5><ul class="list-disc list-inside space-y-2 mt-2 pl-6 text-gray-600"><li>Include the **Merchant token**.</li><li>Describe **why** you are concerned with the specific account.</li><li>Include any related links or associated Stripe accounts.</li><li>Avoid describing things as "suspicious"; use "unusual" instead.</li></ul></li>
                        <li><h5 class="font-semibold text-gray-800 inline">What Happens Next?</h5><p class="pl-6 text-gray-600">Financial Crimes reviews the information within 1 business day. If the activity looks unusual, a case is opened, which could result in a Suspicious Activity Report (SAR). If not, we note our findings and clear the alert. No further action is required from you.</p></li>
                    </ol>`
            },
            {
                title: 'Understanding Unusual Activity',
                icon: 'fa-search',
                content: `<p class="mb-4 text-gray-600">Unusual activity can be conducted by any party in the Stripe ecosystem. Here is a non-exhaustive list of signals:</p>
                    <div class="space-y-4">
                        <div class="p-4 bg-gray-50 rounded-lg border"><h6 class="font-semibold text-gray-700">Discrepancy in Business Purpose</h6><ul class="list-disc list-inside text-gray-600 mt-2 pl-2"><li>Mismatch between stated business and actual transaction activity.</li><li>Activity is not normal for the industry.</li><li>User in one country logs in exclusively from high-risk jurisdictions.</li></ul></div>
                        <div class="p-4 bg-gray-50 rounded-lg border"><h6 class="font-semibold text-gray-700">Unusual Merchant/Rep Actions</h6><ul class="list-disc list-inside text-gray-600 mt-2 pl-2"><li>Supporting documentation seems off.</li><li>Merchant rep is on a blacklist.</li><li>User refuses to provide info or is aggressive.</li></ul></div>
                        <div class="p-4 bg-gray-50 rounded-lg border"><h6 class="font-semibold text-gray-700">Unusual Transaction Patterns</h6><ul class="list-disc list-inside text-gray-600 mt-2 pl-2"><li>Transactions don't make sense for the business location (e.g., UK business with all charges from LATAM).</li><li>Repetitive charges from a single end-user with no clear purpose.</li><li>Excessive transactions (e.g., large ACH Top Ups) unexplained by the business model.</li></ul></div>
                        <div class="p-4 bg-gray-50 rounded-lg border"><h6 class="font-semibold text-gray-700">Potentially Illegal Content</h6><ul class="list-disc list-inside text-gray-600 mt-2 pl-2"><li>Website sells items of questionable legality (e.g., weapons, certain drugs, illicit pornography).</li></ul></div>
                    </div>`
            },
            {
                title: 'Examples of Great AML Referrals',
                icon: 'fa-star',
                content: `<p class="mb-4 text-gray-600">These paraphrased examples show the kind of detail that is helpful to the AML team.</p>
                    <div class="space-y-4">
                        <blockquote class="p-4 bg-indigo-50 border-l-4 border-indigo-400 text-indigo-800">"Three connected accounts share a bank account. Similar businesses (landscaping), but no info on them via Google. Notes three other potentially relevant accounts: acct_aa; acct_bb; acct_cc."</blockquote>
                        <blockquote class="p-4 bg-indigo-50 border-l-4 border-indigo-400 text-indigo-800">"All charges have the same BIN and were made using prepaid cards; charge amounts are small but increasing. IPs appear to be supporting VPNs and are associated with illicit payments (mostly fraud)."</blockquote>
                    </div>`
            },
            {
                title: 'Frequently Asked Questions (FAQ)',
                icon: 'fa-question-circle',
                content: `<div class="space-y-4">
                    <div><h6 class="font-semibold text-gray-700">What if someone else already raised an AML review?</h6><p class="text-gray-600 mt-1 pl-2">We still want to hear from you! You might have additional findings not covered in prior reviews.</p></div>
                    <div><h6 class="font-semibold text-gray-700">What if the activity spans several accounts?</h6><p class="text-gray-600 mt-1 pl-2">If they are clearly connected by the Duplicates panel, you only need to raise one review. Note the other account tokens in your referral.</p></div>
                    <div><h6 class="font-semibold text-gray-700">Does an AML Review affect the user?</h6><p class="text-gray-600 mt-1 pl-2">No, in most cases. We may reach out for more info or file a SAR, but the user won't know about the SAR. We only reject users where we identify a significant risk.</p></div>
                </div>`
            }
        ];

        const accordionContainer = document.getElementById('resources-accordion-container');
        if (accordionContainer) {
            accordionContainer.innerHTML = '';
            accordionData.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'bg-white rounded-lg shadow-sm';
                const buttonEl = document.createElement('button');
                buttonEl.className = 'accordion-button w-full flex justify-between items-center text-left p-5 font-semibold text-gray-800 hover:bg-gray-50 rounded-lg';
                buttonEl.innerHTML = `<span class="flex items-center text-lg"><i class="fas ${item.icon} text-indigo-500 mr-4 w-5 text-center"></i>${item.title}</span><svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
                const contentEl = document.createElement('div');
                contentEl.className = 'accordion-content';
                contentEl.innerHTML = `<div class="p-5 pt-0 text-gray-600">${item.content}</div>`;
                buttonEl.addEventListener('click', () => {
                    const content = buttonEl.nextElementSibling;
                    buttonEl.querySelector('svg').classList.toggle('rotate-180');
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                    } else {
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                });
                itemEl.appendChild(buttonEl);
                itemEl.appendChild(contentEl);
                accordionContainer.appendChild(itemEl);
            });
        }
    }
    
    // --- ROLL OF HONOUR CAROUSEL ---
    function initializeRnrCarousel() { /* ... content from previous versions ... */ }


    // --- PAGE NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    const mobileMenu = document.getElementById('mobile-menu');
    let pageInitialized = {};

    function switchPage(pageId) {
        window.scrollTo(0, 0);
        pageContents.forEach(page => {
            page.classList.toggle('active', page.id === `page-${pageId}`);
            if (page.id === `page-${pageId}`) {
                page.classList.add('fade-in');
                if (pageId === 'home' && !pageInitialized.home) {
                    renderOrgChart();
                    renderHomeAccordion();
                    pageInitialized.home = true;
                }
                if (pageId === 'resources' && !pageInitialized.resources) {
                    renderResourcesContent();
                    pageInitialized.resources = true;
                }
                if (pageId === 'roll-of-honour' && !pageInitialized.rnr) {
                    initializeRnrCarousel();
                    pageInitialized.rnr = true;
                }
            }
        });
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
        mobileMenu.classList.add('hidden');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(link.dataset.page);
        });
    });

    const menuBtn = document.getElementById('menu-btn');
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    
    // Re-add the R&R carousel function to ensure it's in scope
    initializeRnrCarousel = function() {
        const carouselItems = document.querySelectorAll('.rnr-carousel-item');
        const prevBtn = document.getElementById('rnr-prevBtn');
        const nextBtn = document.getElementById('rnr-nextBtn');
        if (!carouselItems.length || !prevBtn || !nextBtn) return;
        
        let currentIndex = 0;
        let autoSlideInterval;

        function showItem(index) {
            carouselItems.forEach((item, i) => {
                item.classList.toggle('hidden', i !== index);
            });
        }
        
        function nextItem() {
            currentIndex = (currentIndex + 1) % carouselItems.length;
            showItem(currentIndex);
        }

        function prevItem() {
            currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
            showItem(currentIndex);
        }
        
        function startAutoSlide() {
            stopAutoSlide();
            autoSlideInterval = setInterval(nextItem, 5000);
        }

        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }

        nextBtn.addEventListener('click', () => { nextItem(); startAutoSlide(); });
        prevBtn.addEventListener('click', () => { prevItem(); startAutoSlide(); });
        
        startAutoSlide();
    };

              // Initial page load
    switchPage('home');
    
    // Initialize in the correct order
    setTimeout(() => {
        initVantaEffect(); // Initialize Vanta effect first
        createParticleBackground(); // Then initialize particle background
        initThemeToggle(); // Finally initialize theme toggle
    }, 100); // Small delay to ensure DOM is fully ready
  });
