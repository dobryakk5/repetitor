    let currentVariant = 0;
    let currentTemplateVariant = 0;
    let userChoices = {};
    let completedVariants = new Set();
    let currentMode = 'parts';

    // Для морфологического разбора
    let currentMorphWord = null;
    let morphAnswers = {};
    let activeMorphTab = null;
    let morphDisplayMap = {};

    // Для синтаксического разбора (определение роли слова)
    let currentSyntaxWord = null;
    let syntaxRoleAnswers = {};
    let currentSyntaxRoles = {};
    let activeSyntaxTab = null;
    let syntaxDisplayMap = {};

    // Для вкладки "Шаблоны"
    let selectedTemplate = null;
    let selectedVerbType = null;
    let clickedVerb = null;

    // Данные (sentenceVariants, wordData, analysisTemplates, abbreviations,
    // templateVariants, sentenceTemplates, verbTypes) загружаются из файла data.js

    // ===== ОСНОВНЫЕ ФУНКЦИИ =====

    function normalizeWord(word) {
        return word.replace(/[.,!?;:]+$/g, '').toLowerCase();
    }

    function splitSentence(sentence) {
        return sentence.trim().split(/\s+/);
    }

    function getSentenceWordList(sentence) {
        return splitSentence(sentence).map((word, idx) => {
            const clean = word.replace(/[.,!?;:]+$/g, '');
            const punctuation = word.slice(clean.length);
            return {
                key: clean.toLowerCase(),
                display: clean,
                punctuation,
                index: idx
            };
        });
    }

    function getActiveVariants(mode = currentMode) {
        return mode === 'templates' ? templateVariants : sentenceVariants;
    }

    function getActiveVariantIndex(mode = currentMode) {
        return mode === 'templates' ? currentTemplateVariant : currentVariant;
    }

    function updateVariantInfo(mode = currentMode) {
        const variants = getActiveVariants(mode);
        const index = getActiveVariantIndex(mode);
        const info = document.getElementById('variant-info');
        if (info) {
            info.textContent = `Вариант ${index + 1} из ${variants.length}`;
        }
    }

    function renderVariantGrid(mode = currentMode) {
        const variants = getActiveVariants(mode);
        const grid = document.getElementById('variant-grid');
        grid.innerHTML = '';

        variants.forEach((_, index) => {
            const btn = document.createElement('button');
            btn.className = 'variant-btn';
            btn.id = `variant-${index}`;
            btn.innerHTML = `
                <span class="check-mark" id="check-${index}"></span>
                ${index + 1}
            `;
            btn.onclick = () => {
                if (mode === 'templates') {
                    switchTemplateVariant(index);
                } else {
                    switchVariant(index);
                }
            };
            grid.appendChild(btn);
        });

        updateVariantButtons(mode);
    }

    function init() {
        renderVariantGrid(currentMode);
        loadVariant();
        loadSyntaxTab();
        loadMorphologyTab();
        loadTemplateTab();
        updateVariantInfo();
        initPartButtons();
    }

    function initPartButtons() {
        document.querySelectorAll('.part-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectPart(btn.getAttribute('data-part'));
            });
        });
    }

    function switchVariant(index) {
        currentVariant = index;
        resetVariant();
        loadVariant();
        loadSyntaxTab();
        loadMorphologyTab();
        updateVariantButtons('parts');
        updateVariantInfo('parts');
    }

    function switchTemplateVariant(index) {
        currentTemplateVariant = index;
        resetTemplateState();
        loadTemplateTab();
        updateVariantButtons('templates');
        updateVariantInfo('templates');
    }

    function loadVariant() {
        const variant = sentenceVariants[currentVariant];
        updateVariantInfo('parts');
        
        const sentenceDiv = document.getElementById('sentence');
        const words = getSentenceWordList(variant.sentence);
        
        sentenceDiv.innerHTML = words.map((word) => {
            const cleanWord = word.key;
            
            if (variant.correct[cleanWord]) {
                return `<span class="word" data-word="${cleanWord}" data-index="${word.index}" onclick="selectWord('${cleanWord}')">${word.display}</span>${word.punctuation}`;
            }
            return `${word.display}${word.punctuation}`;
        }).join(' ');

        document.getElementById('result-message').style.display = 'none';
        document.getElementById('check-btn').disabled = false;
    }

    function buildSyntaxRoles(variant) {
        if (variant.syntaxRoles) {
            return variant.syntaxRoles;
        }

        const roles = {};
        const allowedRoles = new Set(CONFIG.syntaxRoles || []);
        const words = getSentenceWordList(variant.sentence);
        words.forEach(word => {
            if (wordData[word.key] && wordData[word.key].type !== undefined) {
                const role = wordData[word.key].type;
                roles[word.key] = allowedRoles.has(role) ? role : null;
            } else {
                roles[word.key] = null;
            }
        });
        return roles;
    }

    function loadSyntaxTab() {
        const variant = sentenceVariants[currentVariant];
        currentSyntaxRoles = buildSyntaxRoles(variant);
        
        const syntaxSentenceDiv = document.getElementById('syntax-sentence');
        const words = getSentenceWordList(variant.sentence);

        syntaxDisplayMap = {};
        syntaxSentenceDiv.innerHTML = words.map((word) => {
            if (!syntaxDisplayMap[word.key]) {
                syntaxDisplayMap[word.key] = word.display;
            }
            if (currentSyntaxRoles[word.key] !== null && currentSyntaxRoles[word.key] !== undefined) {
                return `<span class="word" data-word="${word.key}" data-index="${word.index}" onclick="selectSyntaxWord('${word.key}')">${word.display}</span>${word.punctuation}`;
            }
            return `${word.display}${word.punctuation}`;
        }).join(' ');

        const tabsContainer = document.getElementById('syntax-tabs-container');
        const panelsContainer = document.getElementById('syntax-panels');
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (panelsContainer) panelsContainer.innerHTML = '';
        activeSyntaxTab = null;
        currentSyntaxWord = null;

        document.getElementById('syntax-result-message').style.display = 'none';
        const syntaxCheckBtn = document.getElementById('syntax-check-btn');
        if (syntaxCheckBtn) syntaxCheckBtn.disabled = false;
    }

    function loadMorphologyTab() {
        const variant = sentenceVariants[currentVariant];
        
        const morphSentenceDiv = document.getElementById('morph-sentence');
        const words = getSentenceWordList(variant.sentence);

        morphDisplayMap = {};
        morphSentenceDiv.innerHTML = words.map((word) => {
            if (wordData[word.key]) {
                if (!morphDisplayMap[word.key]) {
                    morphDisplayMap[word.key] = word.display;
                }
                return `<span class="word" data-word="${word.key}" data-index="${word.index}" onclick="selectMorphWord('${word.key}')">${word.display}</span>${word.punctuation}`;
            }
            return `${word.display}${word.punctuation}`;
        }).join(' ');

        const tabsContainer = document.getElementById('tabs-container');
        const panelsContainer = document.getElementById('analysis-panels');
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (panelsContainer) panelsContainer.innerHTML = '';
        activeMorphTab = null;

        document.getElementById('morph-result-message').style.display = 'none';
    }

    function selectSyntaxWord(word) {
        currentSyntaxWord = word;
        document.querySelectorAll('#syntax-sentence .word').forEach(w => w.classList.remove('selected'));
        const wordEl = document.querySelector(`#syntax-sentence .word[data-word="${word}"]`);
        if (wordEl) wordEl.classList.add('selected');

        const tabsContainer = document.getElementById('syntax-tabs-container');
        const existingTab = document.getElementById(`syntax-tab-${word}`);

        if (!existingTab) {
            createSyntaxTab(word, tabsContainer);
        }

        activateSyntaxTab(word);
        updateSyntaxWordVisuals();
    }

    function createSyntaxTab(word, tabsContainer) {
        if (!tabsContainer) return;

        const label = syntaxDisplayMap[word] || word;
        const tab = document.createElement('button');
        tab.className = 'tab';
        tab.id = `syntax-tab-${word}`;
        tab.textContent = label;
        tab.addEventListener('click', () => activateSyntaxTab(word));
        tabsContainer.appendChild(tab);

        createSyntaxPanel(word);
    }

    function activateSyntaxTab(word) {
        document.querySelectorAll('#syntax-tabs-container .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#syntax-panels .analysis-container').forEach(p => p.classList.remove('active'));

        const tab = document.getElementById(`syntax-tab-${word}`);
        const panel = document.getElementById(`syntax-panel-${word}`);

        if (tab) tab.classList.add('active');
        if (panel) panel.classList.add('active');

        activeSyntaxTab = word;
        currentSyntaxWord = word;

        const selectedRole = syntaxRoleAnswers[word];
        if (selectedRole) {
            highlightSyntaxRole(word, selectedRole);
        }
    }

    function createSyntaxPanel(word) {
        const panelsContainer = document.getElementById('syntax-panels');
        if (!panelsContainer) return;

        const panel = document.createElement('div');
        panel.className = 'analysis-container';
        panel.id = `syntax-panel-${word}`;

        const roleOptions = CONFIG.syntaxRoles || [];
        const label = syntaxDisplayMap[word] || word;

        panel.innerHTML = `
            <div class="section">
                <div class="section-title">Роль слова: ${label}</div>
                <div class="syntax-role-options">
                    ${roleOptions.map(role => `
                        <button class="syntax-role-option" data-role="${role}" onclick="selectSyntaxRole('${word}', '${role}')">${role}</button>
                    `).join('')}
                </div>
            </div>
        `;

        panelsContainer.appendChild(panel);
    }

    function highlightSyntaxRole(word, role) {
        const panel = document.getElementById(`syntax-panel-${word}`);
        if (!panel) return;

        panel.querySelectorAll('.syntax-role-option').forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
        });

        const selectedBtn = panel.querySelector(`.syntax-role-option[data-role="${role}"]`);
        if (!selectedBtn) return;

        selectedBtn.classList.add('selected');
        const correctRole = currentSyntaxRoles[word];
        if (correctRole) {
            if (role === correctRole) {
                selectedBtn.classList.add('correct');
            } else {
                selectedBtn.classList.add('incorrect');
            }
        }
    }

    function selectSyntaxRole(word, role) {
        syntaxRoleAnswers[word] = role;
        highlightSyntaxRole(word, role);

        updateSyntaxWordVisuals();
        
        document.getElementById('syntax-result-message').style.display = 'none';
        const syntaxCheckBtn = document.getElementById('syntax-check-btn');
        if (syntaxCheckBtn) syntaxCheckBtn.disabled = false;
    }

    function updateSyntaxWordVisuals() {
        document.querySelectorAll('#syntax-sentence .word').forEach(wordEl => {
            const word = wordEl.getAttribute('data-word');
            wordEl.className = 'word';
            
            if (syntaxRoleAnswers[word]) {
                wordEl.classList.add(syntaxRoleAnswers[word]);
            }
        });
    }

    function checkSyntaxRoles() {
        const resultMsg = document.getElementById('syntax-result-message');
        let errors = 0;
        let notProcessed = 0;
        
        const wordsToCheck = Object.keys(currentSyntaxRoles).filter(w => currentSyntaxRoles[w] !== null);
        const total = wordsToCheck.length;

        for (let word of wordsToCheck) {
            if (!syntaxRoleAnswers[word]) {
                notProcessed++;
            } else if (syntaxRoleAnswers[word] !== currentSyntaxRoles[word]) {
                errors++;
            }
        }

        if (notProcessed > 0) {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Не все слова обработаны. Обработано: ${total - notProcessed} из ${total}.`;
            resultMsg.style.display = 'block';
        } else if (errors === 0) {
            resultMsg.className = 'result-message success';
            resultMsg.textContent = '🎉 Отлично! Все роли определены правильно!';
            resultMsg.style.display = 'block';
            const syntaxCheckBtn = document.getElementById('syntax-check-btn');
            if (syntaxCheckBtn) syntaxCheckBtn.disabled = true;

            if (currentSyntaxWord) {
                const correctRole = currentSyntaxRoles[currentSyntaxWord];
                highlightSyntaxRole(currentSyntaxWord, correctRole);
            }
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Есть ошибки. Правильных ответов: ${total - errors} из ${total}`;
            resultMsg.style.display = 'block';

            if (currentSyntaxWord) {
                const userRole = syntaxRoleAnswers[currentSyntaxWord];
                const correctRole = currentSyntaxRoles[currentSyntaxWord];
                const panel = document.getElementById(`syntax-panel-${currentSyntaxWord}`);
                if (panel) {
                    panel.querySelectorAll('.syntax-role-option').forEach(opt => {
                        opt.classList.remove('selected', 'correct', 'incorrect');
                    });

                    if (correctRole) {
                        const correctBtn = panel.querySelector(`.syntax-role-option[data-role="${correctRole}"]`);
                        if (correctBtn) correctBtn.classList.add('correct');
                    }

                    if (userRole) {
                        const userBtn = panel.querySelector(`.syntax-role-option[data-role="${userRole}"]`);
                        if (userBtn) {
                            userBtn.classList.add('selected');
                            if (userRole !== correctRole) {
                                userBtn.classList.add('incorrect');
                            }
                        }
                    }
                }
            }
        }
    }

    function resetSyntaxRoles() {
        syntaxRoleAnswers = {};
        currentSyntaxWord = null;
        currentSyntaxRoles = {};
        activeSyntaxTab = null;
        
        const tabsContainer = document.getElementById('syntax-tabs-container');
        const panelsContainer = document.getElementById('syntax-panels');
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (panelsContainer) panelsContainer.innerHTML = '';

        document.getElementById('syntax-result-message').style.display = 'none';
        const syntaxCheckBtn = document.getElementById('syntax-check-btn');
        if (syntaxCheckBtn) syntaxCheckBtn.disabled = false;
        
        document.querySelectorAll('#syntax-sentence .word').forEach(wordEl => {
            wordEl.className = 'word';
        });
    }

    function selectMorphWord(word) {
        currentMorphWord = word;

        document.querySelectorAll('#morph-sentence .word').forEach(w => w.classList.remove('selected'));
        const wordEl = document.querySelector(`#morph-sentence .word[data-word="${word}"]`);
        if (wordEl) wordEl.classList.add('selected');

        const tabsContainer = document.getElementById('tabs-container');
        const existingTab = document.getElementById(`tab-${word}`);

        if (!existingTab) {
            createMorphTab(word, tabsContainer);
        }

        activateMorphTab(word);

        const resultMsg = document.getElementById('morph-result-message');
        if (resultMsg) resultMsg.style.display = 'none';
    }

    function createMorphTab(word, tabsContainer) {
        if (!tabsContainer) return;

        const label = morphDisplayMap[word] || word;
        const tab = document.createElement('button');
        tab.className = 'tab';
        tab.id = `tab-${word}`;
        tab.textContent = label;
        tab.addEventListener('click', () => activateMorphTab(word));
        tabsContainer.appendChild(tab);

        createMorphPanel(word);
    }

    function activateMorphTab(word) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.analysis-container').forEach(p => p.classList.remove('active'));

        const tab = document.getElementById(`tab-${word}`);
        const panel = document.getElementById(`panel-${word}`);

        if (tab) tab.classList.add('active');
        if (panel) panel.classList.add('active');

        activeMorphTab = word;
    }

    function createMorphPanel(word) {
        const panelsContainer = document.getElementById('analysis-panels');
        if (!panelsContainer) return;

        const panel = document.createElement('div');
        panel.className = 'analysis-container';
        panel.id = `panel-${word}`;

        panel.innerHTML = buildMorphFieldsMarkup(word);
        panelsContainer.appendChild(panel);

        if (morphAnswers[word]) {
            for (let prop in morphAnswers[word]) {
                updateMorphFieldButtons(word, prop);
            }
        }
    }

    function buildMorphFieldsMarkup(word) {
        const data = wordData[word];
        const partOfSpeech = (data && data.part) ? data.part : 'существительное';
        const fields = analysisTemplates[partOfSpeech] || analysisTemplates['существительное'];

        if (!fields || fields.length === 0) {
            return `
                <div class="section">
                    <div class="section-title">Морфологический разбор</div>
                    <div>Для этого слова морфологический разбор не требуется.</div>
                </div>
            `;
        }

        return fields.map(field => `
            <div class="section" data-prop="${field.prop}">
                <div class="section-title">${field.title}</div>
                <div class="btn-group">
                    ${field.options.map(opt => `
                        <button class="option"
                                data-field="${field.prop}"
                                data-value="${opt}"
                                onclick="selectMorphOption('${word}', '${field.prop}', '${opt}')">${opt}</button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    function updateMorphFieldButtons(word, field) {
        const panel = document.getElementById(`panel-${word}`);
        if (!panel) return;

        panel.querySelectorAll(`.option[data-field="${field}"]`).forEach(btn => {
            btn.classList.remove('active', 'option-correct', 'option-incorrect');
        });

        const value = morphAnswers[word] ? morphAnswers[word][field] : null;
        if (!value) return;

        const selectedBtn = panel.querySelector(`.option[data-field="${field}"][data-value="${value}"]`);
        if (!selectedBtn) return;

        selectedBtn.classList.add('active');

        const correctValue = wordData[word] && wordData[word].analysis ? wordData[word].analysis[field] : null;
        if (correctValue) {
            if (value === correctValue) {
                selectedBtn.classList.add('option-correct');
            } else {
                selectedBtn.classList.add('option-incorrect');
            }
        }
    }

    function selectMorphOption(word, field, value) {
        if (!morphAnswers[word]) {
            morphAnswers[word] = {};
        }
        morphAnswers[word][field] = value;

        updateMorphFieldButtons(word, field);

        evaluateMorphologyProgress();
    }

    function evaluateMorphologyProgress() {
        const variant = sentenceVariants[currentVariant];
        const resultMsg = document.getElementById('morph-result-message');

        const wordsInSentence = getSentenceWordList(variant.sentence)
            .map(word => word.key)
            .filter((word, idx, arr) => arr.indexOf(word) === idx);

        const wordsToCheck = wordsInSentence.filter(word => {
            return wordData[word] && wordData[word].analysis && Object.keys(wordData[word].analysis).length > 0;
        });

        if (wordsToCheck.length === 0) {
            resultMsg.style.display = 'none';
            return;
        }

        let processedWords = 0;
        let errors = 0;

        for (let word of wordsToCheck) {
            if (morphAnswers[word]) {
                processedWords++;
                const correctAnswers = wordData[word].analysis;
                const userAnswers = morphAnswers[word];

                for (let prop in correctAnswers) {
                    if (userAnswers[prop] !== correctAnswers[prop]) {
                        errors++;
                        break;
                    }
                }
            }
        }

        if (processedWords < wordsToCheck.length) {
            resultMsg.style.display = 'none';
            return;
        }

        if (errors === 0) {
            resultMsg.className = 'result-message success';
            resultMsg.textContent = `🎉 Отлично! Все ${wordsToCheck.length} слов разобраны правильно!`;
            resultMsg.style.display = 'block';
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Есть ошибки. Проверьте параметры, отмеченные красным.`;
            resultMsg.style.display = 'block';
        }
    }

    function resetMorphology() {
        morphAnswers = {};
        currentMorphWord = null;
        activeMorphTab = null;
        
        const tabsContainer = document.getElementById('tabs-container');
        const panelsContainer = document.getElementById('analysis-panels');
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (panelsContainer) panelsContainer.innerHTML = '';

        document.querySelectorAll('#morph-sentence .word').forEach(w => w.classList.remove('selected'));

        document.getElementById('morph-result-message').style.display = 'none';
    }

    function getIcon(part) {
        return CONFIG.icons[part] || '❓';
    }

    let selectedWord = null;
    let selectedPart = null;

    function selectWord(word) {
        selectedWord = word;
        
        document.querySelectorAll('.word').forEach(w => w.classList.remove('selected'));
        document.querySelector(`[data-word="${word}"]`).classList.add('selected');
        document.querySelectorAll('.part-btn').forEach(b => b.classList.remove('active'));
        
        if (selectedPart) {
            const wordToApply = selectedWord;
            const partToApply = selectedPart;
            const btnEl = document.querySelector(`.part-btn[data-part="${partToApply}"]`);
            const variant = sentenceVariants[currentVariant];

            applyPartOfSpeech(wordToApply, partToApply);

            if (btnEl) {
                btnEl.classList.add('active');
                if (variant.correct[wordToApply]) {
                    if (partToApply === variant.correct[wordToApply]) {
                        btnEl.classList.add('part-correct');
                    } else {
                        btnEl.classList.add('part-incorrect');
                    }
                }
            }

            selectedWord = null;
            selectedPart = null;
            document.querySelectorAll('.word').forEach(w => w.classList.remove('selected'));
        }
    }

    function selectPart(part) {
        selectedPart = part;
        
        document.querySelectorAll('.part-btn').forEach(o => o.classList.remove('active', 'part-correct', 'part-incorrect'));
        const optionEl = document.querySelector(`.part-btn[data-part="${part}"]`);
        if (optionEl) optionEl.classList.add('active');
        
        if (selectedWord) {
            const wordToApply = selectedWord;
            const partToApply = selectedPart;
            const variant = sentenceVariants[currentVariant];

            applyPartOfSpeech(wordToApply, partToApply);

            if (optionEl && variant.correct[wordToApply]) {
                if (partToApply === variant.correct[wordToApply]) {
                    optionEl.classList.add('part-correct');
                } else {
                    optionEl.classList.add('part-incorrect');
                }
            }

            selectedWord = null;
            selectedPart = null;
            document.querySelectorAll('.word').forEach(w => w.classList.remove('selected'));
        }
    }

    function resetVariant() {
        userChoices = {};
        selectedWord = null;
        selectedPart = null;
        morphAnswers = {};
        currentMorphWord = null;
        syntaxRoleAnswers = {};
        currentSyntaxWord = null;
        
        document.querySelectorAll('.word').forEach(w => {
            w.classList.remove('selected', 'correct', 'incorrect', 'not-processed');
            w.removeAttribute('data-part');
            w.removeAttribute('data-part-abbr');
        });
        
        document.querySelectorAll('.part-btn').forEach(o => o.classList.remove('active', 'part-correct', 'part-incorrect'));
        
        const resultMsg = document.getElementById('result-message');
        if (resultMsg) {
            resultMsg.style.display = 'none';
            document.getElementById('check-btn').disabled = false;
        }

        const morphResultMsg = document.getElementById('morph-result-message');
        if (morphResultMsg) {
            morphResultMsg.style.display = 'none';
        }

        const syntaxResultMsg = document.getElementById('syntax-result-message');
        if (syntaxResultMsg) {
            syntaxResultMsg.style.display = 'none';
            const syntaxCheckBtn = document.getElementById('syntax-check-btn');
            if (syntaxCheckBtn) syntaxCheckBtn.disabled = false;
        }

        const tabsContainer = document.getElementById('tabs-container');
        const panelsContainer = document.getElementById('analysis-panels');
        if (tabsContainer) tabsContainer.innerHTML = '';
        if (panelsContainer) panelsContainer.innerHTML = '';

        const syntaxTabsContainer = document.getElementById('syntax-tabs-container');
        const syntaxPanelsContainer = document.getElementById('syntax-panels');
        if (syntaxTabsContainer) syntaxTabsContainer.innerHTML = '';
        if (syntaxPanelsContainer) syntaxPanelsContainer.innerHTML = '';
    }

    function resetTemplateState() {
        selectedTemplate = null;
        selectedVerbType = null;
        clickedVerb = null;
        resetTemplate();
    }

    function applyPartOfSpeech(word, part) {
        userChoices[word] = part;
        
        const wordEl = document.querySelector(`[data-word="${word}"]`);
        wordEl.setAttribute('data-part', part);
        wordEl.setAttribute('data-part-abbr', abbreviations[part] || part);
    }

    function checkVariant() {
        const variant = sentenceVariants[currentVariant];
        const resultMsg = document.getElementById('result-message');
        let errors = 0;
        let total = Object.keys(variant.correct).length;
        let notProcessed = 0;
        
        document.querySelectorAll('.word').forEach(wordEl => {
            const word = wordEl.getAttribute('data-word');
            wordEl.classList.remove('correct', 'incorrect', 'not-processed');
            
            if (variant.correct[word]) {
                if (userChoices[word]) {
                    if (userChoices[word] === variant.correct[word]) {
                        wordEl.classList.add('correct');
                    } else {
                        wordEl.classList.add('incorrect');
                        errors++;
                    }
                } else {
                    wordEl.classList.add('not-processed');
                    notProcessed++;
                }
            }
        });
        
        if (notProcessed > 0) {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Не все слова обработаны. Обработано: ${Object.keys(userChoices).length} из ${total}. Слова, выделенные желтым, требуют определения части речи.`;
            resultMsg.style.display = 'block';
        } else if (errors === 0) {
            resultMsg.className = 'result-message success';
            resultMsg.textContent = '🎉 Отлично! Все правильно!';
            resultMsg.style.display = 'block';
            completedVariants.add(currentVariant);
            updateVariantButtons('parts');
            updateStats();
            document.getElementById('check-btn').disabled = true;
            
            showNameModal(total, errors);
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Есть ошибки. Проверьте слова, отмеченные красным. Правильных ответов: ${total - errors} из ${total}`;
            resultMsg.style.display = 'block';
        }
    }

    function updateVariantButtons(mode = currentMode) {
        const variants = getActiveVariants(mode);
        const currentIndex = getActiveVariantIndex(mode);

        variants.forEach((_, index) => {
            const btn = document.getElementById(`variant-${index}`);
            const check = document.getElementById(`check-${index}`);

            if (!btn) return;

            btn.classList.remove('active', 'completed');

            if (index === currentIndex) {
                btn.classList.add('active');
            }

            if (mode !== 'templates' && completedVariants.has(index)) {
                btn.classList.add('completed');
                if (check) check.textContent = '✓';
            } else if (check) {
                check.textContent = '';
            }
        });
    }

    function checkMorphology() {
        const variant = sentenceVariants[currentVariant];
        const resultMsg = document.getElementById('morph-result-message');
        let totalWords = 0;
        let correctWords = 0;
        let processedWords = 0;

        const wordsInSentence = getSentenceWordList(variant.sentence)
            .map(word => word.key)
            .filter((word, idx, arr) => arr.indexOf(word) === idx);

        const wordsToCheck = wordsInSentence.filter(word => {
            return wordData[word] && wordData[word].analysis && Object.keys(wordData[word].analysis).length > 0;
        });

        for (let word of wordsToCheck) {
            totalWords++;

            if (morphAnswers[word]) {
                processedWords++;
                const correctAnswers = wordData[word].analysis;
                const userAnswers = morphAnswers[word];

                let wordCorrect = true;
                for (let prop in correctAnswers) {
                    if (userAnswers[prop] !== correctAnswers[prop]) {
                        wordCorrect = false;
                        break;
                    }
                }

                if (wordCorrect && Object.keys(userAnswers).length === Object.keys(correctAnswers).length) {
                    correctWords++;
                }
            }
        }
        
        if (processedWords === 0) {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = 'Выберите хотя бы одно слово и заполните его разбор';
            resultMsg.style.display = 'block';
            return;
        }
        
        if (correctWords === processedWords && processedWords === totalWords) {
            resultMsg.className = 'result-message success';
            resultMsg.textContent = `🎉 Отлично! Все ${totalWords} слов разобраны правильно!`;
            resultMsg.style.display = 'block';
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Обработано слов: ${processedWords} из ${totalWords}. Правильно разобрано: ${correctWords}. Неправильные параметры отмечены красным.`;
            resultMsg.style.display = 'block';
        }

        if (currentMorphWord && morphAnswers[currentMorphWord]) {
            const correctAnswers = wordData[currentMorphWord].analysis;
            const userAnswers = morphAnswers[currentMorphWord];
            const panel = document.getElementById(`panel-${currentMorphWord}`);

            if (panel) {
                panel.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('option-correct', 'option-incorrect');

                    const field = opt.getAttribute('data-field');
                    const value = opt.getAttribute('data-value');

                    if (correctAnswers[field] === value) {
                        opt.classList.add('option-correct');
                    } else if (userAnswers[field] === value && userAnswers[field] !== correctAnswers[field]) {
                        opt.classList.add('option-incorrect');
                    }
                });
            }
        }
    }

    // ===== ФУНКЦИИ ДЛЯ ВКЛАДКИ "ШАБЛОНЫ" =====

    function loadTemplateTab() {
        const variant = templateVariants[currentTemplateVariant];
        
        // Отображение предложения
        const templateSentenceDiv = document.getElementById('template-sentence');
        templateSentenceDiv.textContent = variant.sentence;
        
        // Отображение вариантов шаблонов
        const templateOptionsDiv = document.getElementById('template-options');
        templateOptionsDiv.innerHTML = sentenceTemplates.map(template => `
            <div class="template-option" data-template="${template.code}" onclick="selectTemplate('${template.code}')">
                <div class="template-code">${template.code}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-example">Пример: ${template.example}</div>
            </div>
        `).join('');

        // Отображение предложения для выбора глагола
        const verbSentenceDiv = document.getElementById('template-verb-sentence');
        const words = variant.sentence.split(' ');
        verbSentenceDiv.innerHTML = words.map((word, idx) => {
            const cleanWord = word.replace(/[.,!?;:]$/, '');
            const punctuation = word.slice(cleanWord.length);
            
            if (variant.verb === cleanWord) {
                return `<span class="word" data-word="${cleanWord}" style="cursor: pointer; padding: 2px 6px; border-radius: 4px;" onclick="selectVerb('${cleanWord}')">${cleanWord}</span>${punctuation}`;
            }
            return word;
        }).join(' ');

        // Отображение вариантов типов глагола
        const verbTypeOptionsDiv = document.getElementById('verb-type-options');
        verbTypeOptionsDiv.innerHTML = verbTypes.map(type => `
            <div class="verb-type-option" data-type="${type.code}" onclick="selectVerbType('${type.code}')">
                <div class="verb-type-code">${type.code}</div>
                <div class="verb-type-name">${type.name}</div>
            </div>
        `).join('');

        document.getElementById('template-result-message').style.display = 'none';
    }

    function selectTemplate(templateCode) {
        selectedTemplate = templateCode;

        updateTemplateSelectionStyles();
        evaluateTemplateProgress();
    }

    function selectVerb(word) {
        clickedVerb = word;
        updateTemplateSelectionStyles();
        evaluateTemplateProgress();
    }

    function selectVerbType(typeCode) {
        selectedVerbType = typeCode;

        updateTemplateSelectionStyles();
        evaluateTemplateProgress();
    }

    function resetTemplate() {
        selectedTemplate = null;
        selectedVerbType = null;
        clickedVerb = null;
        
        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect');
        });
        
        document.querySelectorAll('.verb-type-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect');
        });

        document.querySelectorAll('#template-verb-sentence .word').forEach(w => {
            w.classList.remove('correct', 'incorrect', 'selected');
            w.style.backgroundColor = '';
            w.style.color = '';
        });

        document.getElementById('template-result-message').style.display = 'none';
    }

    function updateTemplateSelectionStyles() {
        const variant = templateVariants[currentTemplateVariant];

        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect');
            const code = opt.getAttribute('data-template');
            if (code === selectedTemplate) {
                opt.classList.add('selected');
                if (code === variant.template) {
                    opt.classList.add('correct');
                } else {
                    opt.classList.add('incorrect');
                }
            }
        });

        document.querySelectorAll('.verb-type-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect');
            const code = opt.getAttribute('data-type');
            if (code === selectedVerbType) {
                opt.classList.add('selected');
                if (code === variant.verbType) {
                    opt.classList.add('correct');
                } else {
                    opt.classList.add('incorrect');
                }
            }
        });

        document.querySelectorAll('#template-verb-sentence .word').forEach(w => {
            w.classList.remove('correct', 'incorrect', 'selected');
            w.style.backgroundColor = '';
            w.style.color = '';
        });

        if (clickedVerb) {
            const wordEl = document.querySelector(`#template-verb-sentence [data-word="${clickedVerb}"]`);
            if (wordEl) {
                wordEl.classList.add('selected');
                if (clickedVerb === variant.verb) {
                    wordEl.classList.add('correct');
                } else {
                    wordEl.classList.add('incorrect');
                }
            }
        }
    }

    function evaluateTemplateProgress() {
        const variant = templateVariants[currentTemplateVariant];
        const resultMsg = document.getElementById('template-result-message');

        if (!selectedTemplate || !clickedVerb || !selectedVerbType) {
            resultMsg.style.display = 'none';
            return;
        }

        const errors = [];

        if (selectedTemplate !== variant.template) {
            errors.push('шаблон');
        }
        if (clickedVerb !== variant.verb) {
            errors.push('глагол');
        }
        if (selectedVerbType !== variant.verbType) {
            errors.push('тип глагола');
        }

        if (errors.length === 0) {
            resultMsg.className = 'result-message success';
            resultMsg.textContent = '🎉 Отлично! Всё правильно!';
            resultMsg.style.display = 'block';
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Ошибки: ${errors.join(', ')}.`;
            resultMsg.style.display = 'block';
        }
    }

    // ===== КОНЕЦ ФУНКЦИЙ ДЛЯ ВКЛАДКИ "ШАБЛОНЫ" =====

    function switchMainTab(mode) {
        currentMode = mode;
        
        document.querySelectorAll('.main-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'));
        
        if (mode === 'parts') {
            document.querySelector('.main-tab[onclick*="parts"]').classList.add('active');
            document.getElementById('parts-tab').classList.add('active');
        } else if (mode === 'templates') {
            document.querySelector('.main-tab[onclick*="templates"]').classList.add('active');
            document.getElementById('templates-tab').classList.add('active');
        } else if (mode === 'syntax') {
            document.querySelector('.main-tab[onclick*="syntax"]').classList.add('active');
            document.getElementById('syntax-tab').classList.add('active');
        } else {
            document.querySelector('.main-tab[onclick*="morphology"]').classList.add('active');
            document.getElementById('morphology-tab').classList.add('active');
        }

        const gridMode = mode === 'templates' ? 'templates' : 'parts';
        renderVariantGrid(gridMode);
        updateVariantInfo(gridMode);
    }

    let currentCorrect = 0;
    let currentTotal = 0;

    function showNameModal(total, errors) {
        currentCorrect = total - errors;
        currentTotal = total;
        
        const modal = document.getElementById('name-modal');
        modal.style.display = 'flex';
        
        const message = document.getElementById('modal-message');
        message.textContent = `Вы правильно определили ${currentCorrect} из ${currentTotal} слов в варианте ${currentVariant + 1}!`;
    }

    function closeNameModal() {
        const modal = document.getElementById('name-modal');
        modal.style.display = 'none';
        document.getElementById('user-name-input').value = '';
    }

    async function saveToLeaderboard() {
        const nameInput = document.getElementById('user-name-input');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Пожалуйста, введите ваше имя');
            return;
        }

        try {
            closeNameModal();
            
            const accuracy = currentTotal > 0 ? (currentCorrect / currentTotal) * 100 : 0;
            alert(`✓ Результат сохранён! ${name}: ${currentCorrect}/${currentTotal} (${accuracy.toFixed(1)}%)`);
            
        } catch (error) {
            console.error('Ошибка сохранения в leaderboard:', error);
            alert('Не удалось сохранить результат. Попробуйте ещё раз.');
        }
    }

    function updateStats() {
        const statsSection = document.getElementById('stats-section');
        const completed = completedVariants.size;
        const total = sentenceVariants.length;
        
        if (completed > 0) {
            statsSection.style.display = 'block';
            document.getElementById('stat-completed').textContent = completed;
            document.getElementById('stat-total').textContent = total;
            
            const accuracy = (completed / total) * 100;
            document.getElementById('stat-accuracy').textContent = accuracy.toFixed(0) + '%';
        }
    }

    window.onload = init;
