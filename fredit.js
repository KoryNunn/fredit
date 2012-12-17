//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

;(function(){

    var oldSelection = !window.getSelection;

    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    function isNode(object){
        return (
            typeof Node === "object" ? object instanceof Node : 
            object && typeof object === "object" && typeof object.nodeType === "number" && typeof object.nodeName==="string"
        );
    }

    function crel(){
        var args = Array.prototype.slice.call(arguments),
            type = args.shift(),
            settings = args.shift(),
            children = args,
            element = document.createElement(type);
            
        if(isNode(settings) || typeof settings !== 'object') {
            children = [settings].concat(children); 
            settings = {};
        }
        
        for(var i = 0; i < children.length; i++){
            child = children[i];
            
            if(child == null){
                continue;
            }
            
            if(!isNode(child)){
                child = document.createTextNode(child);
            }
            
            element.appendChild(child);
        }
        
        for(var key in settings){
            element.setAttribute(key, settings[key]);
        }
        
        return element;
    }
    
    function addControl(editor, label, operationName, operation){
        if(!(editor instanceof Freditor)){
            return;
        }
        
        var controls = editor.controls;
            
        controls.append(crel('button', {'type':'button','class':'btn ' + operationName, 'data-operation':operationName}, label));
        editor.operations[operationName] = operation || editor.operations[operationName];
    }

    function createEditorControls(){
        return $(crel('div',{'class':'controls btn-group'}));
    }
    
    function selectionIsCaret(){
        var selection;
        if (oldSelection) {
            selection = document.selection;
        } else {
            selection = window.getSelection();
        }
        if(selection.type==='Caret'){
            return true;
        }
    }
    
    function modifySelection(alter, direction, granularity){
        if(oldSelection && document.selection.type == "Text"){
            var range = document.selection.createRange();
            range.moveStart("word", 1);
            range.moveEnd("word", 1);
            switch(alter){
                case "move":
                    if(direction === 'forward'){
                        range.moveStart(granularity, 1);
                        range.moveEnd(granularity, 1);
                    }else{
                        range.moveStart(granularity, 1); 
                        range.moveEnd(granularity, 1);                   
                    }
                    break;
                case "extend":
                    if(direction === 'forward'){
                        range.moveEnd(granularity, 1);
                    }else{
                        range.moveStart(granularity, 1);                    
                    }
            }
            range.select();
        }else if(window.getSelection().modify){
            window.getSelection().modify(alter, direction, granularity);
        }
    }
    
    //http://stackoverflow.com/questions/4709073/in-webkit-how-do-i-add-another-word-to-the-range
    function selectTargetWord(){
        if(!selectionIsCaret()){
            return;
        }
        modifySelection("move", "backward", "word");
        modifySelection("extend", "forward", "word");
    }
    
    function wrapTargetWith(element, targetNode){
        
        selectTargetWord();
        
        var selection = document.getSelection(),
            range = selection.getRangeAt(0);
            
        targetNode = targetNode || element;
        
        targetNode.appendChild(range.extractContents()); 
        range.insertNode(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    function getCommonSelectedNode(){
        if(oldSelection){
            return document.selection.createRange().parentElement();
        }else{
            var selection = document.getSelection(),
                range;
                
            if(!selection.rangeCount){
                return;
            }
                
            range = selection.getRangeAt(0);
            
            return range.commonAncestorContainer;
        }
    }
        
    function getElementAtCaret(){
        var selection = document.getSelection();
        
        if(selectionIsCaret()){
            return selection.anchorNode;
        }
    }
    
    function selectNode(element) {
        var range = document.createRange();
        range.selectNodeContents(element);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    function removeEmptyElements(element){
        //http://dev.w3.org/html5/markup/syntax.html#syntax-elements        
        var voidNodes = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        
        for(var i = 0; i < element.childNodes.length; i++){
            if(element.childNodes[i].nodeType === 3){
                if(element.childNodes[i].nodeValue === ""){
                    element.removeChild(element.childNodes[i]);
                }
            }else if(element.childNodes[i].nodeType === 8){
                // commentNode :|
                element.removeChild(element.childNodes[i]);
            }else{
                var childNode = element.childNodes[i];
                if(voidNodes.indexOf(childNode.tagName != null && childNode.tagName.toLowerCase()) < 0 && !element.childNodes[i].childNodes.length){
                    element.removeChild(element.childNodes[i]);
                    if(!element.childNodes.length){
                        element.parentNode.removeChild(element);
                        break;
                    }
                }else{
                    removeEmptyElements(element.childNodes[i])
                }
            }
        }
    }
    
    function replaceDivsWithParagraphs(target){
        target.find('div').each(function(){
            var replacementP = crel('p');
            $(replacementP).append(this.childNodes);
            $(this).replaceWith(replacementP);
        });
    }
    
    function sanitise(){       
        var editArea = this.editArea;
        
        editArea.find('script, style').remove();
        editArea.find('*').each(function(){
            $(this).removeAttr('style');
        });
        
        replaceDivsWithParagraphs(editArea);
    }

    function Freditor(field, options){
        // clone operation list.
        this.operations = {}
        for(var key in this.constructor.prototype.operations){
            this.operations[key] = this.constructor.prototype.operations[key];
        }
        
        if(field && $(field).length){
            field = $(field);
        }else{
            field = $(crel('textarea', {'class':'richFreditor'}));
        }
        
        this.field = field;
        
        var editor = $(crel('div',{'class':'freditor'})),
            editArea = $(crel('div',{'class':'editArea', 'contenteditable':'true', 'tabindex':0})),
            controls = createEditorControls();
            
        this.editArea = editArea;
        this.controls = controls;
        this.element = editor;
        editor.data('freditor', this);
        
        editArea.height(parseFloat(field.height()) || null).html(field.val());
        
        editor.append(controls, editArea);
        
        field.hide().after(editor);
    }
    Freditor.prototype.constructor = Freditor;
    Freditor.prototype.operations = {
        underline: function(){
            selectTargetWord();
            document.execCommand('underline',false);
        },
        bold: function(){
            selectTargetWord();
            document.execCommand('bold',false);
        },
        italics: function(){
            selectTargetWord();
            document.execCommand('italic',false);
        },
        bullets: function(){
            var newList = crel('ul',crel('li'));
            
            wrapTargetWith(newList, $(newList).find('li')[0]);
        },
        numberedList: function(){
            var newList = crel('ol',crel('li', 'Item'));
            
            wrapTargetWith(newList, newList.childNodes[0]);
        }
    };
    Freditor.prototype.addControl = function(label, operationName, operation){
        addControl(this, label, operationName, operation);
    };
    Freditor.prototype.addDefaultControls = function(){
        this.addControl('Underline', 'underline');
        this.addControl('Bold', 'bold');
        this.addControl('Italics', 'italics');
        this.addControl('Bullets', 'bullets');
        this.addControl('Numbered List', 'numberedList');
    };
    Freditor.prototype.sanitise = sanitise;
    Freditor.prototype.performOperation = function(operation){
        if($(getCommonSelectedNode()).closest(this.editArea).length){
            this.operations[operation].call(this);
        }
    };
    
    // addControl(editor, 'Definition list', 'definitionList', function(editor){
        // var newList = crel('dl', crel('dt'));
        
        // wrapTargetWith(newList, newList.childNodes[0]);            
    // });
    // editor.on('keydown', function(event){
        // var atCaret = $(getElementAtCaret());
        // if(atCaret.closest('dl').length && event.which === 9){ // tab
            // event.preventDefault();
            // if(atCaret.closest('dt').length){
                // var nextNode = atCaret.closest('dt').next();
                // if(!nextNode.length){
                    // atCaret.closest('dt').after(crel('dd', '(definition)'));
                // }
                // selectNode(atCaret.closest('dt').next()[0]);
            // }else{
                // var nextNode = atCaret.closest('dd').next();
                // if(!nextNode.length){
                    // atCaret.closest('dd').after(crel('dt',(title)'));
                // }
                // selectNode(atCaret.closest('dd').next()[0]);
            // }
        // }
    // });
    
    // addControl(editor, 'Link', 'anchor', function(editor){            
        // wrapTargetWith(crel('a', {'href':window.prompt("Enter the link URL")}));
    // });
    
    // delegated events.
    $(document).on('change cut copy paste drop', '.freditor .editArea', function(event){
        var editorElement = $(event.target).closest('.freditor'),
            editor = editorElement.data('freditor');
            
        setTimeout(function(){
            editor.sanitise();
            editor.field.val(editor.editArea.html());
        },0);
    }).on('click', '.freditor .controls button', function(event){
        var button = $(event.target).closest('button'),
            operation = button.data('operation'),
            editorElement = button.closest('.freditor'),
            editor = editorElement.data('freditor');
        
            editor.performOperation(operation);
    }).on('keypress', '.freditor .editArea', function(event){
        var editorElement = $(event.target).closest('.freditor'),
            editArea = editorElement.data('freditor').editArea;
        
        removeEmptyElements(editArea[0]);
        
        editArea.trigger('change');
    });
    
    
    window.freditor = Freditor;
    
})(undefined);