// Definição dos pacotes de ofertas disponíveis
const offerPackages = [
    {
        id: 'freeOffer',
        type: 'daily',
        color: 'blue',
        price: 0.00,
        currency: 'R$',
        title: 'Oferta diária',
        descriptions: [
            'Pacote diário com recursos especiais.',
        ],
        dailyRewards: {
            gold: 0,
            cash: 10,
        },
        onPurchase: {
            gold: 0,
            cash: 0,
        }
    },
    // {
    //     id: 'noAdsPack',
    //     type: 'permanent',
    //     color: 'blue',
    //     price: 4.99,
    //     currency: 'R$',
    //     title: 'Cartão Permanente',
    //     subtitle: 'Sem Anúncios',
    //     descriptions: [
    //         'Sem anúncios permanente',
    //         'Gemas diárias aumentam',
    //     ],
    //     dailyRewards: null,
    //     onPurchase: {
    //         gold: 0,
    //         cash: 1200,
    //     },
    // },
    {
        id: 'supplyPack',
        type: 'permanent',
        color: 'red',
        price: 29.90,
        currency: 'R$',
        title: 'Cartão de Suprimento',
        subtitle: 'Permanente',
        descriptions: [
            'Ganhe gemas massivas diariamente',
        ],
        dailyRewards: {
            gold: 5000,
            cash: 800,
        },
        onPurchase: {
            gold: 0,
            cash: 3900,
        },
    }
];

const loadOffersData = () => {
    const LOCALSTORAGE_KEY = 'offersData';

    const saved = localStorage.getItem(LOCALSTORAGE_KEY);

    const defaultSettings = {
        offers: offerPackages.map(pkg => ({
            id: pkg.id,
            purchased: pkg.price === 0.00 ? true : false,
            lastClaimedAt: null,
        })),
    };

    if (!saved) {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    try {
        let parsed = JSON.parse(saved);

        // Verifica se todas as ofertas estão presentes, caso contrário, adiciona as ausentes
        offerPackages.forEach(pkg => {
            // Adiciona apenas se não existir
            if (!parsed.offers.find(o => o.id === pkg.id)) {
                parsed.offers.push({
                    id: pkg.id,
                    purchased: false,
                    lastClaimedAt: null,
                });
            }
        });

        // Remove ofertas que não existem mais
        parsed.offers = parsed.offers.filter(o => offerPackages.find(pkg => pkg.id === o.id));

        // Salva as alterações no localStorage
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(parsed));

        return parsed;
    } catch (error) {
        console.error('Erro ao carregar os dados das ofertas:', error);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
    }
};

const offerSettings = ref(loadOffersData());

// Ofertas resetam diariamente às 20PM Horário de Brasília (UTC-3)
const resetHourUTC = 23; // 20PM BRT é 23PM UTC

/**
 * Retorna o próximo horário de reset
 * @returns {Date}
 */
const getNextResetTime = () => {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setUTCHours(resetHourUTC, 0, 0, 0);

    if (now >= nextReset) {
        // Se já passou do horário de reset hoje, agenda para amanhã
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }

    return nextReset;
};

/**
 * Verifica se uma data está no mesmo dia de reset
 * @param {Date} date - Data para verificar
 * @returns {boolean}
 */
const isSameResetDay = (date) => {
    if (!date) return false;

    const lastClaim = new Date(date);
    const now = new Date();

    // Calcula o dia de reset baseado no horário de reset
    const getResetDay = (d) => {
        const adjustedDate = new Date(d);
        // Se for antes do horário de reset, considera o dia anterior
        if (adjustedDate.getUTCHours() < resetHourUTC) {
            adjustedDate.setUTCDate(adjustedDate.getUTCDate() - 1);
        }
        return adjustedDate.toISOString().split('T')[0];
    };

    return getResetDay(lastClaim) === getResetDay(now);
};

/**
 * Determina o estado de uma oferta
 * @param {Object} offer - Oferta com purchased e lastClaimedAt
 * @returns {'pre-purchase' | 'purchased' | 'claimable' | 'claimed'}
 */
const getOfferState = (offer) => {
    // Se não foi comprada, estado é pré-compra
    if (!offer.purchased) {
        return 'pre-purchase';
    }

    // Se foi comprada mas não tem recompensas diárias, está apenas comprada
    const packageInfo = offerPackages.find(pkg => pkg.id === offer.id);
    if (!packageInfo?.dailyRewards) {
        return 'purchased';
    }

    // Se tem recompensas diárias, verifica se pode resgatar
    if (!offer.lastClaimedAt) {
        return 'claimable'; // Nunca resgatou
    }

    // Verifica se já passou do horário de reset desde o último resgate
    if (isSameResetDay(offer.lastClaimedAt)) {
        return 'claimed'; // Já resgatou hoje
    } else {
        return 'claimable'; // Pode resgatar novamente
    }
};

export function useOffers() {
    const getOffers = computed(() => {
        // Retorna todas as ofertas disponíveis com seus estados atuais
        return offerPackages.map(pkg => {
            const offerState = offerSettings.value.offers.find(o => o.id === pkg.id);
            return {
                ...pkg,
                purchased: offerState ? offerState.purchased : false,
                lastClaimedAt: offerState ? offerState.lastClaimedAt : null,
                state: getOfferState(offerState || { purchased: false, lastClaimedAt: null, id: pkg.id }),
            };
        });
    });

    const claimOfferReward = (offerId) => {
        // Se não encontrar a oferta, ou ela já foi resgatada hoje, não faz nada
        const offerIndex = offerSettings.value.offers.findIndex(o => o.id === offerId);
        if (offerIndex === -1) return null;

        const offerState = offerSettings.value.offers[offerIndex];
        const currentState = getOfferState(offerState);

        if (currentState !== 'claimable') {
            return null; // Não pode resgatar
        }

        // Distribuir as recompensas
        const offerPackage = offerPackages.find(pkg => pkg.id === offerId);
        const rewards = { gold: 0, cash: 0 };

        if (offerPackage) {
            const { gold, cash } = offerPackage.dailyRewards || {};

            if (gold && gold > 0) {
                useCurrentRunStore().totalGold += gold;
                rewards.gold = gold;
            }

            if (cash && cash > 0) {
                const { addCash } = useCash();
                addCash(cash);
                rewards.cash = cash;
            }
        }

        // Atualiza o último resgate para agora
        offerSettings.value.offers[offerIndex].lastClaimedAt = new Date().toISOString();
        saveOffersData();
        return rewards;
    };

    const purchaseOffer = (offerId) => {
        // Marca a oferta como comprada
        const offerIndex = offerSettings.value.offers.findIndex(o => o.id === offerId);
        if (offerIndex === -1) return false;

        offerSettings.value.offers[offerIndex].purchased = true;
        saveOffersData();
        return true;
    };

    const saveOffersData = () => {
        localStorage.setItem('offersData', JSON.stringify(offerSettings.value));
    };

    const shouldDisplayGeneralNotification = computed(() => {
        return getOffers.value.some(offer => offer.state === 'claimable');
    });

    return {
        getOffers,
        saveOffersData,
        getNextResetTime,

        claimOfferReward,
        purchaseOffer,
        shouldDisplayGeneralNotification,
    };
}