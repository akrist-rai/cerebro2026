<script>
  // Section opener: a rule with the index, then the number in LED digits
  // beside a display heading. `title` is split so the second half runs hot.
  let { num, label, end = '', title, hot = '' } = $props();
</script>

<div class="head">
  <div class="rule-head"><b>{num}</b><span>{label}</span>{#if end}<span class="end">{end}</span>{/if}</div>
  <div class="row">
    <span class="n led" aria-hidden="true">{num}</span>
    <h2 class="display h2">{title}{#if hot}<em>{hot}</em>{/if}</h2>
  </div>
</div>

<style>
  .head {
    margin-bottom: clamp(24px, 3vw, 40px);
  }

  .row {
    display: flex;
    align-items: baseline;
    gap: clamp(14px, 2.5vw, 34px);
    margin-top: 22px;
  }

  .n {
    flex-shrink: 0;
    font-size: clamp(44px, 7vw, 116px);
    line-height: 0.8;
    color: var(--line-2);
  }

  h2 {
    margin: 0;
  }

  @media (max-width: 620px) {
    .row {
      flex-direction: column;
      gap: 6px;
    }
  }
</style>
