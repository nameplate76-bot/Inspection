/*
 * 전체 업무 공통 Enter 키 입력 이동
 * - Enter: 현재 업무 화면/팝업의 다음 입력 항목으로 이동
 * - Shift + Enter: textarea/contenteditable에서 줄바꿈
 * - 한글 IME 조합 중 Enter 및 기존 화면이 처리한 Enter는 건드리지 않음
 */
(function installEnterNavigation(){
  'use strict';

  const FIELD_SELECTOR = [
    'input:not([type="hidden"]):not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[contenteditable="true"]'
  ].join(',');

  const SKIP_INPUT_TYPES = new Set([
    'button', 'submit', 'reset', 'checkbox', 'radio', 'file',
    'image', 'range', 'color', 'hidden', 'search'
  ]);

  function isVisible(element){
    if(!(element instanceof HTMLElement)) return false;
    if(element.hidden || element.closest('[hidden],[aria-hidden="true"]')) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  function isEditableField(element){
    if(!(element instanceof HTMLElement) || !element.matches(FIELD_SELECTOR)) return false;
    if(element.hasAttribute('readonly') || element.getAttribute('aria-disabled') === 'true') return false;
    if(element instanceof HTMLInputElement && SKIP_INPUT_TYPES.has(element.type)) return false;
    if(element.getAttribute('role') === 'searchbox') return false;
    if(element.closest('[role="search"]')) return false;
    if(element.matches('[data-enter-native],[data-enter-action],[data-enter-newline]')) return false;
    return isVisible(element);
  }

  function navigationScope(element){
    const dialog = element.closest('dialog[open],[role="dialog"][aria-modal="true"]');
    if(dialog) return dialog;
    const form = element.closest('form');
    if(form) return form;
    return element.closest('.page.active,[data-page].active,main') || document;
  }

  function fieldsIn(scope){
    return Array.from(scope.querySelectorAll(FIELD_SELECTOR)).filter(isEditableField);
  }

  function focusField(field){
    field.focus({preventScroll:true});
    field.scrollIntoView({behavior:'smooth', block:'nearest', inline:'nearest'});
    if(field instanceof HTMLInputElement && /^(text|tel|email|url|password|number)$/.test(field.type)){
      try{ field.select(); }catch(_error){ /* 일부 모바일 입력 유형은 select를 지원하지 않음 */ }
    }
  }

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' || event.defaultPrevented) return;
    if(event.isComposing || event.keyCode === 229) return;
    if(event.ctrlKey || event.altKey || event.metaKey) return;

    const current = event.target;
    if(!isEditableField(current)) return;
    if(current.getAttribute('aria-expanded') === 'true') return;

    const multiline = current instanceof HTMLTextAreaElement || current.isContentEditable;
    if(multiline && event.shiftKey) return;

    const fields = fieldsIn(navigationScope(current));
    const index = fields.indexOf(current);
    if(index < 0) return;

    event.preventDefault();
    const next = fields.slice(index + 1).find(isEditableField);
    if(next){
      focusField(next);
    }else{
      current.blur();
      current.dispatchEvent(new CustomEvent('pjt:enter-last-field', {bubbles:true}));
    }
  });
})();
