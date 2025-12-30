const dailyMissions = [
    {
        id: 1,
        description: 'Entre no Spaceshooter',
        rewardPoints: 25,
        missionType: 'login',
        missionGoal: 1,
        params: [], // Parâmetros adicionais, se necessário
    },
    {
        id: 2,
        description: 'Complete 2 partidas',
        rewardPoints: 25,
        missionType: 'stage-complete',
        missionGoal: 2,
        params: [], // Parâmetros adicionais, se necessário
    },
    {
        id: 3,
        description: 'Derrote 150 inimigos',
        rewardPoints: 25,
        missionType: 'kill-enemies',
        missionGoal: 150,
        params: [], // Parâmetros adicionais, se necessário
    },
    // {
    //     id: 4,
    //     description: 'Gaste 500 de ouro',
    //     rewardPoints: 20,
    //     missionType: 'spend-gold',
    //     missionGoal: 500,
    //     params: [], // Parâmetros adicionais, se necessário
    // },
    // {
    //     id: 5,
    //     description: 'Aprimore equipamento 1 vez',
    //     rewardPoints: 30,
    //     missionType: 'upgrade-equipment',
    //     missionGoal: 1,
    //     params: [], // Parâmetros adicionais, se necessário
    // },
    {
        id: 6,
        description: 'Jogue por 5 minutos',
        rewardPoints: 25,
        missionType: 'play-time',
        missionGoal: 5, // em minutos
        params: [], // Parâmetros adicionais, se necessário
    },
    // {
    //     id: 7,
    //     description: 'Gaste 20 cifrões',
    //     rewardPoints: 20,
    //     missionType: 'spend-cash',
    //     missionGoal: 20,
    //     params: [], // Parâmetros adicionais, se necessário
    // }
];

const dailyMilestones = {
    20: {
        reward: 'Small Treasure Chest'
    },
    40: {
        reward: 'Medium Treasure Chest'
    },
    60: {
        reward: 'Large Treasure Chest'
    },
    80: {
        reward: 'Epic Treasure Chest'
    },
    100: {
        reward: 'Legendary Treasure Chest'
    },
}

// Carrega configurações do localStorage ou cria padrão
const loadMissionsData = () => {
    const saved = localStorage.getItem('missionsData');

    const defaultSettings = {
        missions: dailyMissions.map(mission => ({
            id: mission.id,
            progress: 0,
            completed: false,
            claimed: false,
        })),
        milestonesClaimed: [], // Marcos diários reivindicados
        lastReset: null, // Data do último reset para controle de missões diárias
        date: new Date().toISOString(),
        totalPointsEarned: 0,
    };

    if (!saved) {
        localStorage.setItem('missionsData', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    try {
        let parsed = JSON.parse(saved);

        // Se as missões não é de hoje, reseta as missões
        const lastResetDate = parsed.lastReset ? new Date(parsed.lastReset) : null;
        const today = new Date();
        const isSameDay = lastResetDate &&
            lastResetDate.getUTCFullYear() === today.getUTCFullYear() &&
            lastResetDate.getUTCMonth() === today.getUTCMonth() &&
            lastResetDate.getUTCDate() === today.getUTCDate();

        if (!isSameDay) {
            parsed = defaultSettings;
            parsed.lastReset = today.toISOString();
        }

        // Remove missões que não existem mais
        parsed.missions = parsed.missions.filter(m => dailyMissions.find(dm => dm.id === m.id));

        // Verifica se todas as missões estão presentes, caso contrário, adiciona a que falta
        dailyMissions.forEach(mission => {
            if (!parsed.missions.find(m => m.id === mission.id)) {
                parsed.missions.push({
                    id: mission.id,
                    progress: 0,
                    completed: false,
                    claimed: false,
                });
            } else {
                // Garante que a missão tenha todas as propriedades necessárias
                const existingMission = parsed.missions.find(m => m.id === mission.id);
                if (existingMission.progress === undefined) existingMission.progress = defaultSettings.progress;
                if (existingMission.completed === undefined) existingMission.completed = defaultSettings.completed;
                if (existingMission.claimed === undefined) existingMission.claimed = defaultSettings.claimed;
            }
        });

        // Salva novamente para garantir que tudo está atualizado
        localStorage.setItem('missionsData', JSON.stringify(parsed));

        return parsed;
    } catch (error) {
        console.error('Failed to parse account level settings from localStorage:', error);
        // Se der erro no parse, retorna padrão
        return defaultSettings;
    }
};

const missionSettings = ref(loadMissionsData());

export function useMissions() {
    // Missões resetam diariamente às 20PM Horário de Brasília (UTC-3)
    const resetHourUTC = 23; // 20PM BRT é 23PM UTC

    const getCurrentMissions = computed(() => {
        // Ordena e retorna as missões atuais com informações completas
        // Ordenação: claimable (completada, não reclamada) > in_progress (não completada, pela proximidade de completar) > claimed (reclamada)
        return missionSettings.value.missions.map(missionStatus => {
            const missionInfo = dailyMissions.find(m => m.id === missionStatus.id);
            return {
                ...missionInfo,
                ...missionStatus,
            };
        }).sort((a, b) => {
            // Define prioridade: claimable (2), in_progress (1), claimed (0)
            const getPriority = (mission) => {
                if (mission.completed && !mission.claimed) return 2; // claimable
                if (!mission.completed) return 1; // in_progress
                return 0; // claimed
            };

            const priorityA = getPriority(a);
            const priorityB = getPriority(b);

            // Se as prioridades são diferentes, ordena pela prioridade
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            // Se ambas são IN_PROGRESS (prioridade 1), ordena pela proximidade de completar
            if (priorityA === 1 && priorityB === 1) {
                const progressPercentA = a.progress / a.missionGoal;
                const progressPercentB = b.progress / b.missionGoal;
                return progressPercentB - progressPercentA; // Maior progresso primeiro
            }

            // Mantém a ordem original para os outros casos
            return 0;
        });
    });

    const getMilestones = computed(() => {
        // Retorna os marcos diários com status de reivindicação
        const milestones = Object.entries(dailyMilestones).map(([points, info]) => {
            console.log('points:', points);
            console.log('info:', info);
            console.log('missionSettings:', missionSettings.value);
            return {
                points: parseInt(points),
                reward: info.reward,
                claimed: missionSettings.value.milestonesClaimed.includes(parseInt(points)),
            };
        });

        console.log('Milestones:', milestones);

        return milestones;
    });

    const saveMissionsData = () => {
        localStorage.setItem('missionsData', JSON.stringify(missionSettings.value));
    };

    // Retorna o próximo horário de reset (sem reatividade)
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

    const getTotalPointsEarned = computed(() => {
        return missionSettings.value.totalPointsEarned > 100 ? 100 : missionSettings.value.totalPointsEarned;
    });

    const claimReward = (missionId) => {
        const mission = missionSettings.value.missions.find(m => m.id === missionId);
        const missionInfo = dailyMissions.find(m => m.id === missionId);

        if (mission && mission.completed && !mission.claimed) {
            mission.claimed = true;
            missionSettings.value.totalPointsEarned += missionInfo.rewardPoints;

            saveMissionsData();
            return true;
        } else {
            console.warn('Missão não encontrada, não concluída ou já reivindicada.');
            return false;
        }
    };

    const claimMilestoneReward = () => {
        // Claim all eligible milestone rewards
        getMilestones.value.forEach(milestone => {
            if (getTotalPointsEarned.value >= milestone.points && !milestone.claimed) {
                missionSettings.value.milestonesClaimed.push(milestone.points);
            }
        });

        saveMissionsData();
    }

    const handleEvent = (eventType, amount = 1, params = []) => {
        let updated = false;

        missionSettings.value.missions.forEach(mission => {
            const missionInfo = dailyMissions.find(m => m.id === mission.id);

            if (missionInfo.missionType === eventType) {
                // Verifica parâmetros adicionais, se houver
                let paramsMatch = true;
                if (missionInfo.params.length > 0) {
                    paramsMatch = missionInfo.params.every((param, index) => param === params[index]);
                }

                if (paramsMatch && !mission.completed) {
                    mission.progress += amount;
                    if (mission.progress >= missionInfo.missionGoal) {
                        mission.progress = missionInfo.missionGoal;
                        mission.completed = true;
                    }
                    updated = true;
                }
            }
        });

        if (updated) {
            saveMissionsData();
        }
    };

    return {
        getNextResetTime,
        saveMissionsData,

        // Missions and Rewards
        getCurrentMissions,
        getTotalPointsEarned,
        getMilestones,
        claimReward,
        claimMilestoneReward,

        // Event Handler
        handleEvent,
    };
}
