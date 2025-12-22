export const useLobbyStore = defineStore('LobbyStore', () => {
    /**
     * AVATARS
     */
    const availableProfileIcons = [
        {
            id: 1,
            name: 'Novato',
            unlockText: 'Avatar básico permanente.',
            iconPath: 'icon-user-01.png',
            locked: false,
        },
        {
            id: 2,
            name: 'Explorador',
            unlockText: 'Avatar básico permanente.',
            iconPath: 'icon-user-02.png',
            locked: false,
        },
        {
            id: 3,
            name: 'Destruidor de Asteroides',
            unlockText: 'Desbloqueado após eliminar 100 asteroides.',
            iconPath: 'icon-user-03.png',
            locked: true,
        },
        {
            id: 4,
            name: 'Próton Master',
            unlockText: 'Desbloqueado após eliminar todos os chefes.',
            iconPath: 'icon-user-04.png',
            locked: true,
        },
    ];

    const currentProfilePicture = ref(null);

    const getCurrentProfilePicture = computed(() => {
        const savedIconId = localStorage.getItem('selectedProfileIconId');

        if (! savedIconId) {
            // Não há ícone salvo, salva o primeiro como padrão e retorna ele
            localStorage.setItem('selectedProfileIconId', availableProfileIcons[0].id);
            currentProfilePicture.value = availableProfileIcons[0];
            return currentProfilePicture.value;
        }

        const foundIcon = availableProfileIcons.find(icon => icon.id === parseInt(savedIconId));
        currentProfilePicture.value = foundIcon ? foundIcon : availableProfileIcons[0];
        return currentProfilePicture.value;
    });

    const selectedProfileIcon = ref(getCurrentProfilePicture.value);

    function selectProfileIcon(icon) {
        selectedProfileIcon.value = icon;
    }

    function confirmProfileIconSelection() {
        if (selectedProfileIcon.value.locked) {
            return;
        }

        // Save to localStorage
        localStorage.setItem('selectedProfileIconId', selectedProfileIcon.value.id);
        currentProfilePicture.value = selectedProfileIcon.value;
    }

    /**
     * Profile Name
     */
    const profileName = ref('Desconhecido');

    const getCurrentProfileName = computed(() => {
        const savedName = localStorage.getItem('profileName');

        if (! savedName) {
            const newName = `Desconhecido${Math.floor(Math.random() * 1000)}`; // Desconhecido123
            localStorage.setItem('profileName', newName);
            profileName.value = newName;
            return profileName.value;
        }

        profileName.value = savedName;

        return profileName.value;
    });

    function changeProfileName(newName) {
        profileName.value = newName;
        localStorage.setItem('profileName', newName);
    }

    return {
        // Avatars
        getCurrentProfilePicture,
        availableProfileIcons,
        selectedProfileIcon,
        selectProfileIcon,
        confirmProfileIconSelection,

        // Profile Name
        getCurrentProfileName,
        changeProfileName,
    }
});
