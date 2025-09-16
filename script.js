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
            color: isLightMode ? 0x635bff : 0xff3f81, // #635bff in light, pink in dark
            color2: isLightMode ? 0x222244 : 0xffffff, // dark blue in light, white in dark
            backgroundColor: isLightMode ? 0xffffff : 0x23153c, // Light/dark background
            size: isLightMode ? 1.4 : 1.2, // Restore original globe size
            speed: 0.80,
            points: isLightMode ? 8.00 : 10.00, // Restore previous density
            maxDistance: isLightMode ? 20.00 : 25.00, // Restore previous connection length
            rotation: 0.2
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
            // Animate toggle slider and icons
            setTimeout(() => {
                const slider = themeToggle.querySelector('.toggle-slider');
                const sun = themeToggle.querySelector('.toggle-icon.sun');
                const moon = themeToggle.querySelector('.toggle-icon.moon');
                if (document.documentElement.classList.contains('dark')) {
                    slider.style.left = '27px';
                    sun.style.opacity = '0.3';
                    moon.style.opacity = '1';
                } else {
                    slider.style.left = '3px';
                    sun.style.opacity = '1';
                    moon.style.opacity = '0.3';
                }
            }, 10);
            // Update particle colors if the canvas exists
            updateParticleColors();
            // Reinitialize Vanta effect with new colors
            initVantaEffect();
        });
        // On load, set slider and icons to correct state
        setTimeout(() => {
            const slider = themeToggle.querySelector('.toggle-slider');
            const sun = themeToggle.querySelector('.toggle-icon.sun');
            const moon = themeToggle.querySelector('.toggle-icon.moon');
            if (document.documentElement.classList.contains('dark')) {
                slider.style.left = '27px';
                sun.style.opacity = '0.3';
                moon.style.opacity = '1';
            } else {
                slider.style.left = '3px';
                sun.style.opacity = '1';
                moon.style.opacity = '0.3';
            }
        }, 100);
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
    const leadImageMap = {
        'Megha Chhaparia': 'meghachhaparia.jpg',
        'Mohit Aditya': 'mohitaditya.jpg',
        'Aparna Jayant': 'ajayant.jpg',
        'Vinayak Shenoy K': 'vinayaks.jpg',
        'Divya Nayak': 'divyanayak.jpg',
        // Team member image mappings
        'Aanchal Mutreja': 'amutreja.jpg',
        'Aanya Chhabria': 'aanyachabs.jpg',
        'Aarush Sharma': 'aarush.jpg',
        'Abhishek B': 'abhish.jpg',
        'Aditya Mathur': 'adimathur.jpg',
        'Agnel Levin': 'agnel-levin.jpg',
        'Akhil Shreyas': 'Akhil-Shreyas.jpg',
        'Aman Husain': 'aman-husain.jpg',
        'Amitha Mathew': 'amithamathew.jpg',
        'Angdeep Sharma': 'angdeep.jpg',
        'Arbaaz Khan': 'arbaaz.jpg',
        'Ashik Gem': 'ashikgem.jpg',
        'Chethan G': 'chetz.jpg',
        'Debalina Biswas': 'debalina.jpg',
        'Fateh N Ahmed': 'fateh.jpg',
        'Geetanjali Gudiseva': 'geetanjalig.jpg',
        'Gyanesh Chaudhary': 'gyanesh.jpg',
        'jishnu Jawahar': 'jishnuj.jpg',
        'Kartikae sharma': 'kartikshr.jpg',
        'Khushi Khandelwal': 'khushikhandelwal.jpg',
        'KRUTHIKA RAMASWAMY': 'kruthikaramaswamy.jpg',
        'Lokesh Raaju Polamarasetty': 'LokeshRaajuPolamarasetty.jpg',
        'M Tikendra Singha': 'mtsingha.jpg',
        'Mehul Shah': 'mehulshah.jpg',
        'Mohammed Sumair': 'sumair.jpg',
        'Muhammad Saaim Dastagir': 'MuhammadSaaimDastagir.jpg',
        'Mujtaba Shah': 'mujtabashah.jpg',
        'Nanda Krishnan U Nair': 'nanda-krishnan-u-nair.jpg',
        'Nandini Karwa': 'nandinikarwa.jpg',
        'Nikita Kanjilal': 'nkanjilal.jpg',
        'Nisha Shetty': 'nishashetty.jpg',
        'Nitin Vashisth': 'nitinvashisth.jpg',
        'Padma Lochan Choudhury': 'padma-lochan-choudhury.jpg',
        'Pallav Makil': 'pallavm.jpg',
        'Pradyumn Gupta': 'prady.jpg',
        'Princy Ann': 'princy-ann.jpg',
        'Puneeth Balaji T': 'puneetht.jpg',
        'Rebecca Siangshai': 'rebeccasiangshai.jpg',
        'Romi Sadhukhan': 'romi.jpg',
        'Saigirijashankar Pati': 'saigirija.jpg',
        'Sanjana Kadlaskar': 'sanjanakadlaskar.jpg',
        'Shalini T': 'ShaliniTangudu.png',
        'Sharib Shams': 'sharib.jpg',
        'Shashi Mehta': 'shashimehta.jpg',
        'Shreeja Dutta': 'shreejadutta.jpg',
        'Sindhu Sampathkumar': 'sindhusampath.jpg',
        'Sneha Agarwal': 'snehaagarwal.jpg',
        'Srijoni Dasgupta': 'SrijoniDasgupta.jpeg',
        'Sriparna Guha Roy': 'sriparnaguharoy.jpg',
        'Sriram Chandrasekaran': 'sriramchandrasekaran.jpeg',
        'Srishti Bhandary': 'srishti.jpg',
        'Suhasini Satapathy': 'suhasini.jpg',
        'Suman S': 'suman-s.jpg',
        'Surbhi Kumari': 'SurbhiKumari.jpg',
        'Vaishnavi V': 'Vaishnavi.png',
        'Vasudevan Sundararaj': 'vasudevan-sundararaj.jpg',
        'Vibhav Prakash': 'vibhavprakash.jpg',
        'Vignesh R': 'vickyvig.jpg',
        'Yusuf Khan': 'yusuf-khan.jpg',
        // Additional team members with correct image mappings
        'Akisha Muthuveerappan': 'akisha.jpg',
        'Arshanath Sasidharan Nalini': 'arshanath-sasidharan-nalini.jpg',
        'Ashwini H': 'ashwinih.jpg',
        'Avinav Chel': 'avinav-chel.jpg',
        'Bindya Cheruvalanda Lava': 'bindyacl.jpg',
        'Chaitanya Vaddadi': 'chaitanya-vaddadi.jpg',
        'Ekansh Lohani': 'ekansh.jpg',
        'Gaurav Kumar': 'gaurav-kumar.jpg',
        'Gurgee Nandy': 'gnandy.jpg',
        'Hemanth Harish G': 'hemanth-harish-g.jpg',
        'Jithin George': 'jithingeorge.jpg',
        'Manish Kumar Sahu': 'manish-kumar-sahu.jpg',
        'Mihir Paryani': 'mihirparyani.jpg',
        'Monica Manisha Monteiro': 'monica-monterio.jpg',
        'Nabanita Mazumdar': 'nabanita-mazumdar.jpg',
        'Nikita Dsouza': 'nikita-dsouza.jpg',
        'Swaroop S Kaushik': 'swaroopsk.jpg',
        'Vathsalya Brahmandam': 'vathsalya.jpg',
        'Vidya t': 'vidya.jpg',
        'Vineeth R': 'vineeth-r.jpg'
    };
    const nameToFilename = (name) => leadImageMap[name] || name.toLowerCase().replace(/ /g, '-').replace(/\./g, '') + '.jpg';
    const nameToInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

    // --- TIMELINE ORG CHART ---
    function renderOrgChart() {
        const teamData = {
            name: 'Megha Chhaparia', title: 'AML LOB Lead', image: 'meghachhaparia.jpg', color: '#8b5cf6',
            children: [
                { name: 'Aparna Jayant', title: 'AML EMEA DRI', image: 'ajayant.jpg', color: '#ef4444', reports: ['Agnel Levin', 'Akhil Shreyas', 'Akisha Muthuveerappan', 'Aman Husain', 'Chethan G', 'Debalina Biswas', 'Ekansh Lohani', 'Gyanesh Chaudhary', 'Kartikae sharma', 'Khushi Khandelwal', 'Mohammed Sumair', 'Muhammad Saaim Dastagir', 'Nanda Krishnan U Nair', 'Padma Lochan Choudhury', 'Princy Ann', 'Saigirijashankar Pati', 'Srijoni Dasgupta', 'Sriram Chandrasekaran', 'Suman S', 'Vasudevan Sundararaj', 'Vathsalya Brahmandam', 'Yusuf Khan', 'jishnu Jawahar'] },
                { name: 'Divya Nayak', title: 'AML EMEA DRI', image: 'divyanayak.jpg', color: '#3b82f6', reports: ['Ashwini H', 'Bindya Cheruvalanda Lava', 'Geetanjali Gudiseva', 'Gurgee Nandy', 'Jithin George', 'Lokesh Raaju Polamarasetty', 'Mihir Paryani', 'Monica Manisha Monteiro', 'Shalini T', 'Surbhi Kumari', 'Swaroop S Kaushik', 'Vaishnavi V', 'Vidya t'] },
                { name: 'Mohit Aditya', title: 'AML APAC DRI', image: 'mohitaditya.jpg', color: '#22c55e', reports: ['Arshanath Sasidharan Nalini', 'Avinav Chel', 'Chaitanya Vaddadi', 'Gaurav Kumar', 'Hemanth Harish G', 'Manish Kumar Sahu', 'Nabanita Mazumdar', 'Nikita Dsouza', 'Vineeth R'] },
                { name: 'Vinayak Shenoy K', title: 'AML US DRI', image: 'vinayaks.jpg', color: '#f97316', reports: ['Aanchal Mutreja', 'Aanya Chhabria', 'Aarush Sharma', 'Abhishek B', 'Aditya Mathur', 'Amitha Mathew', 'Angdeep Sharma', 'Arbaaz Khan', 'Ashik Gem', 'Fateh N Ahmed', 'KRUTHIKA RAMASWAMY', 'M Tikendra Singha', 'Mehul Shah', 'Mujtaba Shah', 'Nandini Karwa', 'Nikita Kanjilal', 'Nisha Shetty', 'Nitin Vashisth', 'Pallav Makil', 'Pradyumn Gupta', 'Puneeth Balaji T', 'Rebecca Siangshai', 'Romi Sadhukhan', 'Sanjana Kadlaskar', 'Sharib Shams', 'Shashi Mehta', 'Shreeja Dutta', 'Sindhu Sampathkumar', 'Sneha Agarwal', 'Sriparna Guha Roy', 'Srishti Bhandary', 'Suhasini Satapathy', 'Vibhav Prakash', 'Vignesh R'] }
            ]
        };

        // Creative bios for tooltips
        const leadBios = {
            'Megha Chhaparia': `
                <span class="lead-title">The Visionary Architect</span>
                <span class="lead-highlight">15+ years</span> of orchestrating global teams in investment banking and fintech.<br>
                <span class="lead-highlight">Expertise:</span> AML, KYC, regulatory wizardry, and process transformation.<br>
                <span class="lead-quote">"Turning complexity into clarity, and teams into families."</span>
                <span class="lead-funfact">Fun fact: Loves automating away the boring stuff!</span>
            `,
            'Mohit Aditya': `
                <span class="lead-title">The Compliance Maestro</span>
                <span class="lead-highlight">Banking & FinCrime Pro</span> with a knack for <span class="lead-highlight">KYC, AML, CTF</span> and team magic.<br>
                <span class="lead-highlight">Engineer at heart</span> (B.E., BVBCET, Hubli) who brings precision and passion to every project.<br>
                <span class="lead-quote">"Building trust, one transaction at a time."</span>
                <span class="lead-funfact">Fun fact: Can explain compliance in three languages!</span>
            `,
            'Aparna Jayant': `
                <span class="lead-title">The Risk Sleuth</span>
                <span class="lead-highlight">14+ years</span> in the trenches of AML consulting and financial crime compliance.<br>
                <span class="lead-highlight">Specialties:</span> Transaction review, KYC, CDD, SARs, and quality control.<br>
                <span class="lead-quote">"Every risk tells a story—let's read between the lines."</span>
                <span class="lead-funfact">Fun fact: Has a sixth sense for spotting fraud before it happens!</span>
            `,
            'Vinayak Shenoy K': `
                <span class="lead-title">The Operations Dynamo</span>
                <span class="lead-highlight">FinCrimes Manager</span> with a legacy at Amazon and a passion for <span class="lead-highlight">AML, KYC, CDD</span>.<br>
                <span class="lead-highlight">Strengths:</span> Mentoring, analytics, and root cause sleuthing.<br>
                <span class="lead-quote">"Results matter, but integrity matters more."</span>
                <span class="lead-funfact">Fun fact: Can solve a Rubik's cube faster than you can say 'compliance'!</span>
            `,
            'Divya Nayak': `
                <span class="lead-title">The Credit Risk Connoisseur</span>
                <span class="lead-highlight">Expert in Global Fraud Risk Standards</span> and a champion at resolving queued transactions within SLAs to reduce potential revenue losses.<br>
                <span class="lead-highlight">System Improver:</span> Always identifying new ways to prevent fraud and boost efficiency.<br>
                <span class="lead-quote">"Every transaction is a puzzle—let's solve it smartly!"</span>
                <span class="lead-funfact">Fun fact: Can spot a risky transaction from a mile away!</span>
            `
        };

        // Helper to check if this is a lead with an expandable bio
        function isLeadWithExpand(name) {
            return [
                'Megha Chhaparia',
                'Mohit Aditya',
                'Aparna Jayant',
                'Vinayak Shenoy K',
                'Divya Nayak'
            ].includes(name);
        }

        const container = document.getElementById('org-chart-container');
        if (!container) return;

        container.innerHTML = `<div class="timeline-org-chart"></div>`;
        const chart = container.querySelector('.timeline-org-chart');

        const lead = teamData;
        const leadColor = lead.color || '#6b7280';
        const leadProfileLink = `/profiles/${lead.name.toLowerCase().replace(/ /g, '-')}`;
        // Render org chart as normal, no special classes for Megha
        chart.innerHTML = `
            <div class="timeline-lead">
                <div class="node-card" style="border-color: ${leadColor}; cursor: pointer;">
                    <img src="images/${lead.image || nameToFilename(lead.name)}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/${leadColor.substring(1)}/ffffff?text=${nameToInitials(lead.name)}';">
                    <div class="name">${lead.name}</div>
                    <div class="title" style="color: ${leadColor};">${lead.title}</div>
                </div>
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
            let cardHtml = `
                <div class="node-card" data-has-reports="${!!reportsHtml}" style="border-color: ${managerColor};">
                    <img src="images/${manager.image || nameToFilename(manager.name)}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/${managerColor.substring(1)}/ffffff?text=${nameToInitials(manager.name)}';">
                    <div class="name">${manager.name}</div>
                    <div class="title" style="color: ${managerColor};">${manager.title}</div>
                    ${reportsHtml}
                </div>`;
            item.innerHTML = cardHtml;
            timelineBody.appendChild(item);
        });
        // Restore expand/collapse logic for direct reports
        chart.querySelectorAll('.node-card[data-has-reports="true"]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.report-item-link')) return;
                const orgItem = card.closest('.org-timeline-item');
                if (!orgItem) return;
                // Collapse all others
                chart.querySelectorAll('.org-timeline-item.expanded').forEach(item => {
                    if (item !== orgItem) item.classList.remove('expanded');
                });
                orgItem.classList.toggle('expanded');
            });
        });

        // Render creative bios for all leads in a new section below the org chart
        let biosSection = document.getElementById('lead-bios-section');
        if (!biosSection) {
            biosSection = document.createElement('section');
            biosSection.id = 'lead-bios-section';
            biosSection.className = 'lead-bios-section';
            chart.parentElement.appendChild(biosSection);
        }
        biosSection.innerHTML = `
            <div class="lead-bios-bg-anim">
                <svg viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="200" cy="100" r="18" fill="#635bff"/>
                    <circle cx="1000" cy="80" r="10" fill="#ff3f81"/>
                    <circle cx="600" cy="350" r="14" fill="#ffe066"/>
                    <circle cx="400" cy="300" r="8" fill="#635bff"/>
                    <circle cx="900" cy="320" r="12" fill="#ff3f81"/>
                    <circle cx="300" cy="200" r="7" fill="#b4baff"/>
                    <circle cx="1100" cy="200" r="9" fill="#635bff"/>
                </svg>
            </div>
            <h2 class="lead-bios-title"><span class="animated-icon"><i class="fas fa-users"></i></span>Meet Our Leadership</h2>
            <div class="lead-bios-cards">
                ${[
                    {name:'Megha Chhaparia', icon:'fa-shield-halved'},
                    {name:'Mohit Aditya', icon:'fa-user-tie'},
                    {name:'Aparna Jayant', icon:'fa-search-dollar'},
                    {name:'Vinayak Shenoy K', icon:'fa-cubes'},
                    {name:'Divya Nayak', icon:'fa-bolt'}
                ].map(({name,icon}) => `
                    <div class="lead-bio-card">
                        <span class="bio-animated-icon"><i class="fas ${icon}"></i></span>
                        <img src="images/${nameToFilename(name)}" class="lead-bio-avatar" alt="${name}">
                        <div class="lead-bio-content">${leadBios[name]}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Parallax effect for vertical bio cards (with rotation and scale)
        function parallaxBios() {
            const cards = document.querySelectorAll('.lead-bio-card');
            const section = document.getElementById('lead-bios-section');
            if (!cards.length || !section) return;
            const sectionRect = section.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            cards.forEach((card, i) => {
                // Each card moves at a slightly different speed and rotates/scales
                const speed = 0.12 + i * 0.07;
                const offset = (sectionRect.top + scrollY - window.innerHeight/2 + card.offsetTop) * speed;
                const rot = Math.sin((scrollY + card.offsetTop) / 200) * 3 * (i % 2 === 0 ? 1 : -1);
                const scale = 1 + Math.cos((scrollY + card.offsetTop) / 300) * 0.015;
                card.style.transform = `translateY(${offset}px) scale(${scale}) rotate(${rot}deg)`;
            });
        }
        function onParallaxScroll() {
            requestAnimationFrame(parallaxBios);
        }
        window.addEventListener('scroll', onParallaxScroll);
        window.addEventListener('resize', onParallaxScroll);
        setTimeout(parallaxBios, 200);

        // Fade-in-up animation for cards as they enter viewport
        const observer = new window.IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('.lead-bio-card').forEach(card => observer.observe(card));
    }

    // --- HOME PAGE ACCORDION ---
    function renderHomeAccordion() { /* ... content from previous versions ... */ }

    // --- RESOURCES PAGE CONTENT (TABBED WITH FLOWCHARTS) ---
    function renderResourcesContent() {
        const container = document.getElementById('resources-content');
        if (!container) return;

        // Only show AML Referrals content
        container.innerHTML = `
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold accent-text mb-4">AML Referrals</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Your guide to identifying and reporting suspicious activity. Learn how to create effective AML referrals and understand the process.
                </p>
            </div>
            <div id="resources-content-panel" class="max-w-4xl mx-auto">
                <!-- AML Referrals content will be rendered here -->
            </div>
        `;

        // Render the AML referrals content
        renderResourcesReference();
    }

    // --- REFERENCE CONTENT TAB (EXISTING ACCORDION) ---
    function renderResourcesReference() {
        const panel = document.getElementById('resources-content-panel');
        if (!panel) return;
        
        // Move the existing accordion and info content here
        panel.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-8">
                <h3 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">AML Referrals Overview</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                        <h4 class="font-bold text-lg text-green-700 dark:text-green-300 mb-3 flex items-center"><i class="fas fa-check-circle mr-2"></i>What to Do</h4>
                        <ul class="list-disc list-inside space-y-3 text-green-800 dark:text-green-200">
                            <li>Submit an AML referral to the team at <a href="#" class="font-semibold underline">go/aml-referral</a>.</li>
                            <li>Follow guidance on <a href="#" class="font-semibold underline">go/unusual-activity</a>.</li>
                            <li>Ask for the team's input via <a href="#" class="font-semibold underline">go/ask/financial-crimes</a>.</li>
                            <li>If you're not sure, it's always worth an ask!</li>
                        </ul>
                    </div>
                    <div class="border-2 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                        <h4 class="font-bold text-lg text-red-700 dark:text-red-300 mb-3 flex items-center"><i class="fas fa-times-circle mr-2"></i>What Not to Do</h4>
                        <ul class="list-disc list-inside space-y-3 text-red-800 dark:text-red-200">
                            <li>Tell a user about Stripe Financial Crimes concerns (tipping off).</li>
                            <li>Fail to share any concerns you have with our team.</li>
                            <li>Help users get around our controls.</li>
                            <li>Offer legal or compliance advice to users.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-r-lg shadow mb-8">
                <h4 class="font-bold text-lg text-yellow-800 dark:text-yellow-300 mb-3 flex items-center"><i class="fas fa-exclamation-triangle mr-2"></i>Important Note on "Tipping Off"</h4>
                <p class="text-yellow-900 dark:text-yellow-200 mb-4">Disclosing sensitive information could lead to serious civil or criminal penalties. AML teams cannot share investigation outcomes. For help with user-facing language, please contact the AML team.</p>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                        <thead class="bg-yellow-100 dark:bg-yellow-900/50">
                            <tr>
                                <th class="text-left py-2 px-4 font-semibold text-yellow-900 dark:text-yellow-200">Country</th>
                                <th class="text-left py-2 px-4 font-semibold text-yellow-900 dark:text-yellow-200">Potential Fine</th>
                                <th class="text-left py-2 px-4 font-semibold text-yellow-900 dark:text-yellow-200">Imprisonment</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-700 dark:text-gray-300">
                            <tr><td class="border-t py-2 px-4">US</td><td class="border-t py-2 px-4">Up to $100k (civil); $250k (criminal)</td><td class="border-t py-2 px-4">Up to 5 years</td></tr>
                            <tr><td class="border-t py-2 px-4">UK</td><td class="border-t py-2 px-4">Unlimited</td><td class="border-t py-2 px-4">Up to 5 years</td></tr>
                            <tr><td class="border-t py-2 px-4">Ireland</td><td class="border-t py-2 px-4">Up to €5k</td><td class="border-t py-2 px-4">Up to 5 years</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="resources-accordion-container" class="space-y-4"></div>
        `;
        
        // Re-render the accordion in the new panel
        const accordionData = [
            {
                title: 'Guide to Creating an AML Referral',
                icon: 'fa-file-alt',
                content: `<p class="mb-4 text-gray-600 dark:text-gray-300">This section explains how Stripes can raise concerns about accounts with the Global AML teams. Referrals will be directed to the regional teams where accounts are opened. If you're not sure, always ask.</p>
                    <ol class="list-decimal list-inside space-y-6">
                        <li><h5 class="font-semibold text-gray-800 dark:text-gray-200 inline">Navigate and Submit</h5><p class="pl-6 text-gray-600 dark:text-gray-300">Go to <a href="#" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">go/aml-referral</a>, select "AML", and input the merchant token and supporting information. This creates a referral under the <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">anti_money_laundering</code> review type in the AML team's queue.</p></li>
                        <li><h5 class="font-semibold text-gray-800 dark:text-gray-200 inline">Draft Your Referral</h5><ul class="list-disc list-inside space-y-2 mt-2 pl-6 text-gray-600 dark:text-gray-300"><li>Include the **Merchant token**.</li><li>Describe **why** you are concerned with the specific account.</li><li>Include any related links or associated Stripe accounts.</li><li>Avoid describing things as "suspicious"; use "unusual" instead.</li></ul></li>
                        <li><h5 class="font-semibold text-gray-800 dark:text-gray-200 inline">What Happens Next?</h5><p class="pl-6 text-gray-600 dark:text-gray-300">Financial Crimes reviews the information within 1 business day. If the activity looks unusual, a case is opened, which could result in a Suspicious Activity Report (SAR). If not, we note our findings and clear the alert. No further action is required from you.</p></li>
                    </ol>`
            },
            {
                title: 'Understanding Unusual Activity',
                icon: 'fa-search',
                content: `<p class="mb-4 text-gray-600 dark:text-gray-300">Unusual activity can be conducted by any party in the Stripe ecosystem. Here is a non-exhaustive list of signals:</p>
                    <div class="space-y-4">
                        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"><h6 class="font-semibold text-gray-700 dark:text-gray-200">Discrepancy in Business Purpose</h6><ul class="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2 pl-2"><li>Mismatch between stated business and actual transaction activity.</li><li>Activity is not normal for the industry.</li><li>User in one country logs in exclusively from high-risk jurisdictions.</li></ul></div>
                        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"><h6 class="font-semibold text-gray-700 dark:text-gray-200">Unusual Merchant/Rep Actions</h6><ul class="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2 pl-2"><li>Supporting documentation seems off.</li><li>Merchant rep is on a blacklist.</li><li>User refuses to provide info or is aggressive.</li></ul></div>
                        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"><h6 class="font-semibold text-gray-700 dark:text-gray-200">Unusual Transaction Patterns</h6><ul class="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2 pl-2"><li>Transactions don't make sense for the business location (e.g., UK business with all charges from LATAM).</li><li>Repetitive charges from a single end-user with no clear purpose.</li><li>Excessive transactions (e.g., large ACH Top Ups) unexplained by the business model.</li></ul></div>
                        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600"><h6 class="font-semibold text-gray-700 dark:text-gray-200">Potentially Illegal Content</h6><ul class="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2 pl-2"><li>Website sells items of questionable legality (e.g., weapons, certain drugs, illicit pornography).</li></ul></div>
                    </div>`
            },
            {
                title: 'Examples of Great AML Referrals',
                icon: 'fa-star',
                content: `<p class="mb-4 text-gray-600 dark:text-gray-300">These paraphrased examples show the kind of detail that is helpful to the AML team.</p>
                    <div class="space-y-4">
                        <blockquote class="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-400 dark:border-indigo-500 text-indigo-800 dark:text-indigo-200">"Three connected accounts share a bank account. Similar businesses (landscaping), but no info on them via Google. Notes three other potentially relevant accounts: acct_aa; acct_bb; acct_cc."</blockquote>
                        <blockquote class="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-400 dark:border-indigo-500 text-indigo-800 dark:text-indigo-200">"All charges have the same BIN and were made using prepaid cards; charge amounts are small but increasing. IPs appear to be supporting VPNs and are associated with illicit payments (mostly fraud)."</blockquote>
                    </div>`
            },
            {
                title: 'Frequently Asked Questions (FAQ)',
                icon: 'fa-question-circle',
                content: `<div class="space-y-4">
                    <div><h6 class="font-semibold text-gray-700 dark:text-gray-200">What if someone else already raised an AML review?</h6><p class="text-gray-600 dark:text-gray-300 mt-1 pl-2">We still want to hear from you! You might have additional findings not covered in prior reviews.</p></div>
                    <div><h6 class="font-semibold text-gray-700 dark:text-gray-200">What if the activity spans several accounts?</h6><p class="text-gray-600 dark:text-gray-300 mt-1 pl-2">If they are clearly connected by the Duplicates panel, you only need to raise one review. Note the other account tokens in your referral.</p></div>
                    <div><h6 class="font-semibold text-gray-700 dark:text-gray-200">Does an AML Review affect the user?</h6><p class="text-gray-600 dark:text-gray-300 mt-1 pl-2">No, in most cases. We may reach out for more info or file a SAR, but the user won't know about the SAR. We only reject users where we identify a significant risk.</p></div>
                </div>`
            }
        ];
        
        const accordionContainer = panel.querySelector('#resources-accordion-container');
        if (accordionContainer) {
            accordionContainer.innerHTML = '';
            accordionData.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700';
                const buttonEl = document.createElement('button');
                buttonEl.className = 'accordion-button w-full flex justify-between items-center text-left p-5 font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors';
                buttonEl.innerHTML = `<span class="flex items-center text-lg"><i class="fas ${item.icon} text-indigo-500 dark:text-indigo-400 mr-4 w-5 text-center"></i>${item.title}</span><svg class="w-5 h-5 shrink-0 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
                const contentEl = document.createElement('div');
                contentEl.className = 'accordion-content overflow-hidden transition-all duration-300';
                contentEl.style.maxHeight = '0';
                contentEl.innerHTML = `<div class="p-5 pt-0 text-gray-600 dark:text-gray-300">${item.content}</div>`;
                
                buttonEl.addEventListener('click', () => {
                    const content = buttonEl.nextElementSibling;
                    const svg = buttonEl.querySelector('svg');
                    svg.classList.toggle('rotate-180');
                    
                    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                        content.style.maxHeight = '0';
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
    // Awards Carousel Function with smooth fade transitions
    function initializeAwardsCarousel() {
        const slides = document.querySelectorAll('.award-slide');
        const prevBtn = document.getElementById('awards-prevBtn');
        const nextBtn = document.getElementById('awards-nextBtn');
        const indicators = document.querySelectorAll('.indicator');
        
        if (!slides.length || !prevBtn || !nextBtn) return;
        
        let currentIndex = 0;
        let autoSlideInterval;
        let isTransitioning = false;

        function showSlide(newIndex, direction = 'next') {
            if (isTransitioning || newIndex === currentIndex) return;
            
            isTransitioning = true;
            const currentSlide = slides[currentIndex];
            const newSlide = slides[newIndex];
            
            // Start fade out current slide
            currentSlide.classList.add('fade-out');
            currentSlide.classList.remove('active');
            
            // After a short delay, start fade in new slide
            setTimeout(() => {
                newSlide.classList.add('fade-in', 'active');
                newSlide.classList.remove('fade-out');
                
                // Restart typing animation for the new slide
                const typingElement = newSlide.querySelector('.typing-animation');
                if (typingElement) {
                    typingElement.style.animation = 'none';
                    setTimeout(() => {
                        typingElement.style.animation = 'typing-loop 6s steps(40, end) infinite, blink-caret 0.75s step-end infinite';
                    }, 50);
                }
                
                // Update indicators
                indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('active', i === newIndex);
                });
                
                currentIndex = newIndex;
                
                // Clean up classes after transition
                setTimeout(() => {
                    slides.forEach(slide => {
                        slide.classList.remove('fade-in', 'fade-out');
                    });
                    isTransitioning = false;
                }, 600); // Match CSS transition duration
                
            }, 100); // Small delay for smoother transition
        }
        
        function nextSlide() {
            const newIndex = (currentIndex + 1) % slides.length;
            showSlide(newIndex, 'next');
        }

        function prevSlide() {
            const newIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(newIndex, 'prev');
        }

        function goToSlide(index) {
            if (index !== currentIndex) {
                const direction = index > currentIndex ? 'next' : 'prev';
                showSlide(index, direction);
            }
        }

        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(nextSlide, 8000); // 8 seconds for longer content
        }

        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }

        // Event listeners for navigation buttons
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isTransitioning) {
                stopAutoSlide();
                prevSlide();
                startAutoSlide();
            }
        });

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isTransitioning) {
                stopAutoSlide();
                nextSlide();
                startAutoSlide();
            }
        });

        // Event listeners for indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isTransitioning) {
                    stopAutoSlide();
                    goToSlide(index);
                    startAutoSlide();
                }
            });
        });

        // Pause auto-slide on hover
        const carousel = document.getElementById('awards-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', stopAutoSlide);
            carousel.addEventListener('mouseleave', startAutoSlide);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('page-roll-of-honour').classList.contains('active') && !isTransitioning) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    stopAutoSlide();
                    prevSlide();
                    startAutoSlide();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    stopAutoSlide();
                    nextSlide();
                    startAutoSlide();
                }
            }
        });

        // Initialize - ensure first slide is properly set
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === 0);
        });
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === 0);
        });
        
        startAutoSlide();
    }

    // Update the old function name for backward compatibility
    initializeRnrCarousel = initializeAwardsCarousel;

    // Initial page load
    switchPage('home');
    
    // Initialize in the correct order
    setTimeout(() => {
        initVantaEffect(); // Initialize Vanta effect first
        createParticleBackground(); // Then initialize particle background
        initThemeToggle(); // Finally initialize theme toggle
    }, 100); // Small delay to ensure DOM is fully ready
  });

// --- HAMBURGER MENU ANIMATION ---
document.addEventListener('DOMContentLoaded', function() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const menuOverlay = document.getElementById('menu-overlay');
  const closeMenuBtn = document.getElementById('close-menu');
  const menuLinks = document.querySelectorAll('.menu-link');
  let menuOpen = false;

  function openMenu() {
    menuOverlay.classList.remove('translate-x-full');
    menuOverlay.classList.add('translate-x-0');
    menuOverlay.style.pointerEvents = 'auto';
    menuOverlay.style.backdropFilter = 'blur(8px)';
    // Animate links in
    menuLinks.forEach((link, i) => {
      setTimeout(() => {
        link.classList.remove('opacity-0', 'translate-x-8');
        link.classList.add('opacity-100', 'translate-x-0');
      }, 80 * i);
    });
    menuOpen = true;
    // Animate hamburger to X
    hamburgerBtn.classList.add('open');
    // Focus trap
    menuOverlay.setAttribute('tabindex', '-1');
    menuOverlay.focus();
  }
  function closeMenu() {
    menuOverlay.classList.add('translate-x-full');
    menuOverlay.classList.remove('translate-x-0');
    menuOverlay.style.pointerEvents = 'none';
    menuOverlay.style.backdropFilter = '';
    // Animate links out
    menuLinks.forEach((link, i) => {
      setTimeout(() => {
        link.classList.add('opacity-0', 'translate-x-8');
        link.classList.remove('opacity-100', 'translate-x-0');
      }, 40 * i);
    });
    menuOpen = false;
    hamburgerBtn.classList.remove('open');
  }
  hamburgerBtn.addEventListener('click', openMenu);
  closeMenuBtn.addEventListener('click', closeMenu);
  menuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  // ESC to close
  document.addEventListener('keydown', e => {
    if (menuOpen && (e.key === 'Escape' || e.key === 'Esc')) closeMenu();
  });
  // Accessibility: focus trap
  menuOverlay.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      closeMenuBtn.focus();
    }
  });
});
