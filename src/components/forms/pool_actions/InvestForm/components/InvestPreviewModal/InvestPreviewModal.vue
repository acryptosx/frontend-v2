<script setup lang="ts">
import { computed, toRefs, ref } from 'vue';
import useTokens from '@/composables/useTokens';
import { FullPool } from '@/services/balancer/subgraph/types';
import { TokenInfoMap } from '@/types/TokenList';
import { bnum } from '@/lib/utils';
import useNumbers from '@/composables/useNumbers';
import InvestSummary from './components/InvestSummary.vue';
import TokenAmounts from './components/TokenAmounts.vue';
import InvestActions from './components/InvestActions.vue';
import { InvestMathResponse } from '../../composables/useInvestMath';
import { useI18n } from 'vue-i18n';
import useInvestState from '../../composables/useInvestState';

/**
 * TYPES
 */
type Props = {
  pool: FullPool;
  math: InvestMathResponse;
  tokenAddresses: string[];
};

type AmountMap = {
  [address: string]: string;
};

/**
 * PROPS & EMITS
 */
const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

/**
 * STATE
 */
const investmentConfirmed = ref(false);

/**
 * COMPOSABLES
 */
const { t } = useI18n();
const { getToken } = useTokens();
const { toFiat } = useNumbers();
const { fullAmounts, priceImpact, highPriceImpact } = toRefs(props.math);
const { resetAmounts } = useInvestState();

/**
 * COMPUTED
 */
const title = computed((): string =>
  investmentConfirmed.value
    ? t('investment.preview.titles.confirmed')
    : t('investment.preview.titles.default')
);

const amountMap = computed(
  (): AmountMap => {
    const amountMap = {};
    fullAmounts.value.forEach((amount, i) => {
      if (hasAmount(i)) amountMap[props.tokenAddresses[i]] = amount;
    });
    return amountMap;
  }
);

const tokenMap = computed(
  (): TokenInfoMap => {
    const tokenMap = {};
    Object.keys(amountMap.value).forEach(address => {
      tokenMap[address] = getToken(address);
    });
    return tokenMap;
  }
);

const fiatAmountMap = computed(
  (): AmountMap => {
    const fiatAmountMap = {};
    Object.keys(amountMap.value).forEach(address => {
      fiatAmountMap[address] = toFiat(amountMap.value[address], address);
    });
    return fiatAmountMap;
  }
);

const fiatTotal = computed((): string =>
  Object.values(fiatAmountMap.value).reduce(
    (total, amount) =>
      bnum(total)
        .plus(amount)
        .toString(),
    '0'
  )
);

/**
 * METHODS
 */
function hasAmount(index: number): boolean {
  return bnum(fullAmounts.value[index]).gt(0);
}

function handleClose(): void {
  if (investmentConfirmed.value) {
    resetAmounts();
  }
  emit('close');
}
</script>

<template>
  <BalModal show :fireworks="investmentConfirmed" @close="handleClose">
    <template v-slot:header>
      <div class="flex items-center">
        <BalCircle
          v-if="investmentConfirmed"
          size="8"
          color="green"
          class="text-white mr-2"
        >
          <BalIcon name="check" />
        </BalCircle>
        <h4>
          {{ title }}
        </h4>
      </div>
    </template>

    <TokenAmounts
      :amountMap="amountMap"
      :tokenMap="tokenMap"
      :fiatAmountMap="fiatAmountMap"
      :fiatTotal="fiatTotal"
    />

    <InvestSummary
      :pool="pool"
      :fiatTotal="fiatTotal"
      :priceImpact="priceImpact"
      :highPriceImpact="highPriceImpact"
    />

    <InvestActions
      :pool="pool"
      :math="math"
      :tokenAddresses="tokenAddresses"
      class="mt-4"
      @success="investmentConfirmed = true"
    />
  </BalModal>
</template>
