export const useLobbyStore = defineStore('LobbyStore', () => {
    const modalOpened = ref(false);
    const currentModal = ref(null);

    function openModal(modalName) {
        currentModal.value = modalName;
        modalOpened.value = true;
    }

    function closeModal() {
        // alert('Closing modal');
        currentModal.value = null;
        modalOpened.value = false;
    }

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

    return {
        // Modal
        modalOpened,
        currentModal,

        openModal,
        closeModal,

        // Avatars
        getCurrentProfilePicture,
        availableProfileIcons,
        selectedProfileIcon,
        selectProfileIcon,
        confirmProfileIconSelection,
    }
});
