    let currentVariant = 0;
    let userChoices = {};
    let completedVariants = new Set();
    let currentMode = 'parts';

    // Для морфологического разбора
    let currentMorphWord = null;
    let morphAnswers = {};

    // Для синтаксического разбора (определение роли слова)
    let currentSyntaxWord = null;
    let syntaxRoleAnswers = {};

    // Для вкладки "Шаблоны"
    let selectedTemplate = null;
    let selectedVerbType = null;
    let clickedVerb = null;

    // Данные (sentenceVariants, wordData, morphologyFields, abbreviations, 
    // sentenceTemplates, verbTypes) загружаются из файла data.js

    // ===== ОСНОВНЫЕ ФУНКЦИИ =====

    function init() {
        loadVariant();
        createVariantButtons();
        updateVariantButtons();
        loadTemplateTab();
        loadSyntaxTab();
        loadMorphologyTab();
    }

    function createVariantButtons() {
        const grid = document.getElementById('variant-grid');
        grid.innerHTML = '';
        
        sentenceVariants.forEach((_, index) => {
            const btn = document.createElement('button');
            btn.className = 'variant-btn';
            btn.id = `variant-${index}`;
            btn.innerHTML = `
                <span class="check-mark" id="check-${index}"></span>
                ${index + 1}
            `;
            btn.onclick = () => switchVariant(index);
            grid.appendChild(btn);
        });
    }

    function switchVariant(index) {
        currentVariant = index;
        resetVariant();
        loadVariant();
        loadTemplateTab();
        loadSyntaxTab();
        loadMorphologyTab();
        updateVariantButtons();
    }

    function loadVariant() {
        const variant = sentenceVariants[currentVariant];
        document.getElementById('variant-info').textContent = `Вариант ${currentVariant + 1} из ${sentenceVariants.length}`;
        
        const sentenceDiv = document.getElementById('sentence');
        const words = variant.sentence.split(' ');
        
        sentenceDiv.innerHTML = words.map((word, idx) => {
            const cleanWord = word.replace(/[.,!?;:]$/, '');
            const punctuation = word.slice(cleanWord.length);
            
            if (variant.correct[cleanWord]) {
                return `<span class="word" data-word="${cleanWord}" data-index="${idx}" onclick="selectWord('${cleanWord}')">${cleanWord}</span>${punctuation}`;
            }
            return word;
        }).join(' ');

        const optionsDiv = document.getElementById('options');
        const parts = [...new Set(Object.values(variant.correct))];
        
        optionsDiv.innerHTML = parts.map(part => `
            <div class="option" data-part="${part}" onclick="selectPart('${part}')">
                <div class="option-icon">${getIcon(part)}</div>
                <div>${part}</div>
            </div>
        `).join('');

        document.getElementById('result-message').style.display = 'none';
        document.getElementById('check-btn').disabled = false;
    }

    function loadSyntaxTab() {
        const variant = sentenceVariants[currentVariant];
        
        const syntaxSentenceDiv = document.getElementById('syntax-sentence');
        const words = variant.sentence.split(' ');
        
        syntaxSentenceDiv.innerHTML = words.map((word, idx) => {
            const cleanWord = word.replace(/[.,!?;:]$/, '');
            const punctuation = word.slice(cleanWord.length);
            
            if (variant.syntaxRoles[cleanWord] !== undefined) {
                return `<span class="word" data-word="${cleanWord}" data-index="${idx}">${cleanWord}</span>${punctuation}`;
            }
            return word;
        }).join(' ');

        const syntaxWordsDiv = document.getElementById('syntax-words');
        const syntaxWords = Object.keys(variant.syntaxRoles).filter(w => variant.syntaxRoles[w] !== null);
        
        syntaxWordsDiv.innerHTML = syntaxWords.map(word => 
            `<button class="syntax-word-btn" data-word="${word}" onclick="selectSyntaxWord('${word}')">${word}</button>`
        ).join('');

        document.getElementById('syntax-result-message').style.display = 'none';
        document.getElementById('syntax-check-btn').disabled = false;
    }

    function loadMorphologyTab() {
        const variant = sentenceVariants[currentVariant];
        
        const morphSentenceDiv = document.getElementById('morph-sentence');
        const words = variant.sentence.split(' ');
        
        morphSentenceDiv.innerHTML = words.map((word, idx) => {
            const cleanWord = word.replace(/[.,!?;:]$/, '');
            const punctuation = word.slice(cleanWord.length);
            
            if (wordData[cleanWord]) {
                return `<span class="word" data-word="${cleanWord}" data-index="${idx}">${cleanWord}</span>${punctuation}`;
            }
            return word;
        }).join(' ');

        const morphWordsDiv = document.getElementById('morph-words');
        const morphWords = Object.keys(wordData);
        
        morphWordsDiv.innerHTML = morphWords.map(word => 
            `<button class="morph-word-btn" data-word="${word}" onclick="selectMorphWord('${word}')">${word}</button>`
        ).join('');

        document.getElementById('morph-result-message').style.display = 'none';
        document.getElementById('morph-check-btn').disabled = false;
    }

    function selectSyntaxWord(word) {
        currentSyntaxWord = word;
        
        document.querySelectorAll('.syntax-word-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.getAttribute('data-word') === word) {
                btn.classList.add('selected');
            }
        });

        const panel = document.getElementById('syntax-role-panel');
        panel.classList.add('active');
        
        document.getElementById('syntax-current-word').textContent = word;
        
        const roleOptions = CONFIG.syntaxRoles;
        const roleOptionsDiv = document.getElementById('syntax-role-options');
        
        roleOptionsDiv.innerHTML = roleOptions.map(role => 
            `<button class="syntax-role-option" data-role="${role}" onclick="selectSyntaxRole('${word}', '${role}')">${role}</button>`
        ).join('');

        if (syntaxRoleAnswers[word]) {
            const selectedBtn = roleOptionsDiv.querySelector(`[data-role="${syntaxRoleAnswers[word]}"]`);
            if (selectedBtn) selectedBtn.classList.add('selected');
        }

        updateSyntaxWordVisuals();
    }

    function selectSyntaxRole(word, role) {
        syntaxRoleAnswers[word] = role;
        
        document.querySelectorAll('#syntax-role-options .syntax-role-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedBtn = document.querySelector(`#syntax-role-options [data-role="${role}"]`);
        if (selectedBtn) selectedBtn.classList.add('selected');

        updateSyntaxWordVisuals();
        
        document.getElementById('syntax-result-message').style.display = 'none';
        document.getElementById('syntax-check-btn').disabled = false;
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
        const variant = sentenceVariants[currentVariant];
        const resultMsg = document.getElementById('syntax-result-message');
        let errors = 0;
        let notProcessed = 0;
        
        const wordsToCheck = Object.keys(variant.syntaxRoles).filter(w => variant.syntaxRoles[w] !== null);
        const total = wordsToCheck.length;

        document.querySelectorAll('#syntax-role-options .syntax-role-option').forEach(opt => {
            opt.classList.remove('correct', 'incorrect');
        });

        for (let word of wordsToCheck) {
            if (!syntaxRoleAnswers[word]) {
                notProcessed++;
            } else if (syntaxRoleAnswers[word] !== variant.syntaxRoles[word]) {
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
            document.getElementById('syntax-check-btn').disabled = true;

            if (currentSyntaxWord) {
                const correctRole = variant.syntaxRoles[currentSyntaxWord];
                document.querySelectorAll('#syntax-role-options .syntax-role-option').forEach(opt => {
                    const role = opt.getAttribute('data-role');
                    if (role === correctRole) {
                        opt.classList.add('correct');
                    }
                });
            }
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Есть ошибки. Правильных ответов: ${total - errors} из ${total}`;
            resultMsg.style.display = 'block';

            if (currentSyntaxWord) {
                const userRole = syntaxRoleAnswers[currentSyntaxWord];
                const correctRole = variant.syntaxRoles[currentSyntaxWord];
                
                document.querySelectorAll('#syntax-role-options .syntax-role-option').forEach(opt => {
                    const role = opt.getAttribute('data-role');
                    if (role === correctRole) {
                        opt.classList.add('correct');
                    } else if (role === userRole) {
                        opt.classList.add('incorrect');
                    }
                });
            }
        }
    }

    function resetSyntaxRoles() {
        syntaxRoleAnswers = {};
        currentSyntaxWord = null;
        
        document.querySelectorAll('.syntax-word-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('syntax-role-panel').classList.remove('active');
        document.getElementById('syntax-result-message').style.display = 'none';
        document.getElementById('syntax-check-btn').disabled = false;
        
        document.querySelectorAll('#syntax-sentence .word').forEach(wordEl => {
            wordEl.className = 'word';
        });
    }

    function selectMorphWord(word) {
        currentMorphWord = word;
        
        document.querySelectorAll('.morph-word-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.getAttribute('data-word') === word) {
                btn.classList.add('selected');
            }
        });

        const analysis = document.getElementById('morph-analysis');
        analysis.classList.add('active');
        
        document.getElementById('morph-current-word').textContent = word;
        
        const data = wordData[word];
        const partOfSpeech = data.analysis['Часть речи'];
        const fields = morphologyFields[partOfSpeech] || morphologyFields['существительное'];
        
        const fieldsDiv = document.getElementById('morph-fields');
        fieldsDiv.innerHTML = fields.map(field => `
            <div class="morph-field">
                <label>${field.name}:</label>
                <div class="morph-options">
                    ${field.options.map(opt => 
                        `<button class="morph-option" 
                                data-field="${field.name}" 
                                data-value="${opt}"
                                onclick="selectMorphOption('${word}', '${field.name}', '${opt}')">${opt}</button>`
                    ).join('')}
                </div>
            </div>
        `).join('');

        if (morphAnswers[word]) {
            for (let prop in morphAnswers[word]) {
                const btn = fieldsDiv.querySelector(`[data-field="${prop}"][data-value="${morphAnswers[word][prop]}"]`);
                if (btn) btn.classList.add('selected');
            }
        }
    }

    function selectMorphOption(word, field, value) {
        if (!morphAnswers[word]) {
            morphAnswers[word] = {};
        }
        morphAnswers[word][field] = value;
        
        document.querySelectorAll(`[data-field="${field}"]`).forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
        
        const selectedBtn = document.querySelector(`[data-field="${field}"][data-value="${value}"]`);
        if (selectedBtn) selectedBtn.classList.add('selected');
        
        document.getElementById('morph-result-message').style.display = 'none';
        document.getElementById('morph-check-btn').disabled = false;
    }

    function resetMorphology() {
        morphAnswers = {};
        currentMorphWord = null;
        
        document.querySelectorAll('.morph-word-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('morph-analysis').classList.remove('active');
        document.getElementById('morph-result-message').style.display = 'none';
        document.getElementById('morph-check-btn').disabled = false;
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
        
        if (selectedPart) {
            applyPartOfSpeech(selectedWord, selectedPart);
            selectedWord = null;
            selectedPart = null;
            document.querySelectorAll('.word').forEach(w => w.classList.remove('selected'));
            document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
        }
    }

    function selectPart(part) {
        selectedPart = part;
        
        document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
        document.querySelector(`[data-part="${part}"]`).classList.add('active');
        
        if (selectedWord) {
            applyPartOfSpeech(selectedWord, selectedPart);
            selectedWord = null;
            selectedPart = null;
            document.querySelectorAll('.word').forEach(w => w.classList.remove('selected'));
            document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
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
        selectedTemplate = null;
        selectedVerbType = null;
        clickedVerb = null;
        
        document.querySelectorAll('.word').forEach(w => {
            w.classList.remove('selected', 'correct', 'incorrect', 'not-processed');
            w.removeAttribute('data-part');
            w.removeAttribute('data-part-abbr');
        });
        
        document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
        
        const resultMsg = document.getElementById('result-message');
        if (resultMsg) {
            resultMsg.style.display = 'none';
            document.getElementById('check-btn').disabled = false;
        }

        const morphResultMsg = document.getElementById('morph-result-message');
        if (morphResultMsg) {
            morphResultMsg.style.display = 'none';
            document.getElementById('morph-check-btn').disabled = false;
        }

        const syntaxResultMsg = document.getElementById('syntax-result-message');
        if (syntaxResultMsg) {
            syntaxResultMsg.style.display = 'none';
            document.getElementById('syntax-check-btn').disabled = false;
        }
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
            updateVariantButtons();
            updateStats();
            document.getElementById('check-btn').disabled = true;
            
            showNameModal(total, errors);
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Есть ошибки. Проверьте слова, отмеченные красным. Правильных ответов: ${total - errors} из ${total}`;
            resultMsg.style.display = 'block';
        }
    }

    function updateVariantButtons() {
        sentenceVariants.forEach((_, index) => {
            const btn = document.getElementById(`variant-${index}`);
            const check = document.getElementById(`check-${index}`);
            
            btn.classList.remove('active', 'completed');
            
            if (index === currentVariant) {
                btn.classList.add('active');
            }
            
            if (completedVariants.has(index)) {
                btn.classList.add('completed');
                check.textContent = '✓';
            } else {
                check.textContent = '';
            }
        });
    }

    function checkMorphology() {
        const resultMsg = document.getElementById('morph-result-message');
        let totalWords = 0;
        let correctWords = 0;
        let processedWords = 0;
        
        for (let word in wordData) {
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
            document.getElementById('morph-check-btn').disabled = true;
        } else {
            resultMsg.className = 'result-message error';
            resultMsg.textContent = `Обработано слов: ${processedWords} из ${totalWords}. Правильно разобрано: ${correctWords}. Неправильные параметры отмечены красным.`;
            resultMsg.style.display = 'block';
        }

        if (currentMorphWord && morphAnswers[currentMorphWord]) {
            const correctAnswers = wordData[currentMorphWord].analysis;
            const userAnswers = morphAnswers[currentMorphWord];
            
            document.querySelectorAll('#morph-fields .morph-option').forEach(opt => {
                opt.classList.remove('correct', 'incorrect');
                
                const field = opt.getAttribute('data-field');
                const value = opt.getAttribute('data-value');
                
                if (correctAnswers[field] === value) {
                    opt.classList.add('correct');
                } else if (userAnswers[field] === value && userAnswers[field] !== correctAnswers[field]) {
                    opt.classList.add('incorrect');
                }
            });
        }
    }

    // ===== ФУНКЦИИ ДЛЯ ВКЛАДКИ "ШАБЛОНЫ" =====

    function loadTemplateTab() {
        const variant = sentenceVariants[currentVariant];
        
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
        document.getElementById('template-check-btn').disabled = false;
    }

    function selectTemplate(templateCode) {
        selectedTemplate = templateCode;
        
        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.getAttribute('data-template') === templateCode) {
                opt.classList.add('selected');
            }
        });

        document.getElementById('template-result-message').style.display = 'none';
        document.getElementById('template-check-btn').disabled = false;
    }

    function selectVerb(word) {
        clickedVerb = word;
        
        // Подсветка выбранного глагола
        document.querySelectorAll('#template-verb-sentence .word').forEach(w => {
            w.style.backgroundColor = '';
            w.style.color = '';
        });
        
        const wordEl = document.querySelector(`#template-verb-sentence [data-word="${word}"]`);
        if (wordEl) {
            wordEl.style.backgroundColor = '#667eea';
            wordEl.style.color = 'white';
        }
    }

    function selectVerbType(typeCode) {
        selectedVerbType = typeCode;
        
        document.querySelectorAll('.verb-type-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.getAttribute('data-type') === typeCode) {
                opt.classList.add('selected');
            }
        });

        document.getElementById('template-result-message').style.display = 'none';
        document.getElementById('template-check-btn').disabled = false;
    }

    function checkTemplate() {
        const variant = sentenceVariants[currentVariant];
        const resultMsg = document.getElementById('template-result-message');
        
        let errors = [];
        let totalChecks = 0;
        let correctChecks = 0;

        // Проверка шаблона
        if (selectedTemplate) {
            totalChecks++;
            const templateOptions = document.querySelectorAll('.template-option');
            templateOptions.forEach(opt => {
                opt.classList.remove('correct', 'incorrect');
                const code = opt.getAttribute('data-template');
                if (code === variant.template) {
                    opt.classList.add('correct');
                    if (code === selectedTemplate) {
                        correctChecks++;
                    }
                } else if (code === selectedTemplate) {
                    opt.classList.add('incorrect');
                }
            });
            
            if (selectedTemplate !== variant.template) {
                errors.push('шаблон');
            }
        } else {
            errors.push('шаблон не выбран');
        }

        // Проверка глагола
        if (clickedVerb) {
            totalChecks++;
            if (clickedVerb === variant.verb) {
                correctChecks++;
            } else {
                errors.push('неправильный глагол');
            }
        } else {
            errors.push('глагол не выбран');
        }

        // Проверка типа глагола
        if (selectedVerbType) {
            totalChecks++;
            const verbTypeOptions = document.querySelectorAll('.verb-type-option');
            verbTypeOptions.forEach(opt => {
                opt.classList.remove('correct', 'incorrect');
                const code = opt.getAttribute('data-type');
                if (code === variant.verbType) {
                    opt.classList.add('correct');
                    if (code === selectedVerbType) {
                        correctChecks++;
                    }
                } else if (code === selectedVerbType) {
                    opt.classList.add('incorrect');
                }
            });
            
            if (selectedVerbType !== variant.verbType) {
                errors.push('тип глагола');
            }
        } else {
            errors.push('тип глагола не выбран');
        }

        // Отображение результата
        if (errors.length === 0 && correctChecks === totalChecks) {
            resultMsg.className = 'result-message success';
            resultMsg.textContent = '🎉 Отлично! Всё правильно!';
            resultMsg.style.display = 'block';
            document.getElementById('template-check-btn').disabled = true;
        } else {
            resultMsg.className = 'result-message error';
            if (totalChecks === 0) {
                resultMsg.textContent = 'Сделайте выбор: укажите шаблон, глагол и его тип';
            } else {
                resultMsg.textContent = `Ошибки: ${errors.join(', ')}. Правильных ответов: ${correctChecks} из ${totalChecks}`;
            }
            resultMsg.style.display = 'block';
        }
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
            w.style.backgroundColor = '';
            w.style.color = '';
        });

        document.getElementById('template-result-message').style.display = 'none';
        document.getElementById('template-check-btn').disabled = false;
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
