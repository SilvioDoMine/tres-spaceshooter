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

    // Verifica se já passou 24h desde o último resgate
    const lastClaim = new Date(offer.lastClaimedAt);
    const now = new Date();
    const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);

    if (hoursSinceLastClaim >= 24) {
        return 'claimable';
    } else {
        return 'claimed'; // Já resgatou hoje
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

    const saveOffersData = () => {
        localStorage.setItem('offersData', JSON.stringify(offerSettings.value));
    };

    return {
        getOffers,
        saveOffersData,
    };
}