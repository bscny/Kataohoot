<template>
    <div class="container">

        <NavBar />


        <LeftBar :folders="folders" @CreateFolder="SetCreateFolder()" @EditFolder="SetEditFolder($event)"
            @DisplayQuestions="SetDisplay($event)" />

        <div v-if="canCreateFolder">
            <FolderCreatePop @Cancel="CancelAction()" @Created="FolderCreated($event)" />
        </div>

        <div v-if="canEditFolder">
            <FolderEditPop :folder="curLookingFolder" @Cancel="CancelAction()" @Edited="FolderEdited($event)"
                @CreateQuiz="AddQuizToFolder($event)" @Deleted="FolderDeleted($event)" />
        </div>

        <div class="display-area" v-if="curLookingQuiz != null">
            <DisplayQuestion :quiz="curLookingQuiz" :questions="curLookingQuestions" :editMode="false"
                @EditingQuiz="EditQuiz()" @TryingQuiz="TryCurrentQuiz()" />
        </div>

    </div>
</template>

<script>
import NavBar from "@/components/NavBar.vue";
import LeftBar from "@/components/UserLibrary/Library/LeftBar.vue";
import FolderCreatePop from "@/components/UserLibrary/Library/FolderCreatePop.vue";
import FolderEditPop from "@/components/UserLibrary/Library/FolderEditPop.vue";
import DisplayQuestion from "@/components/UserLibrary/DisplayQuestion.vue";

import {
    useQuizStore,
    useQuestionsStore,
} from "@/stores/Userlibrary/QuizQuestionStore.js";

import {
    getQuestionsByQuiz,
    GetQuestionsByQuizID
} from '@/service/LibraryApi/QuestionAPI';

import {
    getQuizzesByUserFolder,
    CreateQuiz
} from '@/service/LibraryApi/QuizAPI';

//import FolderAPI
import {
    getSpecUserFolder,
    createFolder,
    updateFolder,
    deleteFolder
} from '@/service/LibraryApi/FolderAPI';

export default {
    name: "UserLibrary",
    components: {
        NavBar,
        LeftBar,
        FolderCreatePop,
        FolderEditPop,
        DisplayQuestion,
    },

    data() {
        return {
            // variables for folder actions
            canCreateFolder: false,
            canEditFolder: false,
            curLookingFolder: null,
            curLookingQuiz: null,
            curLookingQuestions: null,

            // pinia store share variables
            quizStore: useQuizStore(),
            questionsStore: useQuestionsStore(),

            // variables for datas from backend
            // fake data
            folders: [],
        };
    },

    methods: {
        SetCreateFolder() {
            this.canCreateFolder = true;
        },

        async FolderCreated(newFolder) {
            try {
                await createFolder(newFolder);
                alert("Folder Created!");

                await this.FetchFolders();

                this.canCreateFolder = false;
            } catch (error) {
                console.error("Failed to create folder:", error);
            }
        },

        async SetEditFolder(folder) {
            this.curLookingFolder = folder;

            this.canEditFolder = true;
        },

        async FolderEdited(editedFolder) {
            try {
                await updateFolder(editedFolder.Folder_id, editedFolder);
                const index = this.folders.findIndex(folder => folder.Folder_id === editedFolder.Folder_id);
                if (index !== -1) {
                    this.folders = [
                        ...this.folders.slice(0, index),
                        editedFolder,
                        ...this.folders.slice(index + 1),
                    ];
                }
                alert("Change Saved!");
                this.canEditFolder = false;
            } catch (error) {
                console.error("Failed to update folder:", error);
            }
        },

        async AddQuizToFolder(quizData) {
            // add quiz data to current watching quiz
            try {
                await CreateQuiz(quizData);

                // add this quiz to folder array for site rendering
                for (let i = 0; i < this.folders.length; i++) {
                    if (this.folders[i].Folder_id == this.curLookingFolder.Folder_id) {
                        if (this.folders[i].quizzes == null) {
                            // to make sure to treat this.folder.quizzes as an array
                            this.folders[i].quizzes = [];
                        }

                        // append quiz
                        this.folders[i].quizzes.push(quizData);
                    }
                }
                await this.FetchFolders();
                this.canEditFolder = false;
            } catch (error) {
                console.error("failed to add quiz to folder");
            }
        },

        async FolderDeleted(deletedFolderID) {
            try {
                await deleteFolder(deletedFolderID);
                for (let i = 0; i < this.folders.length; i++) {
                    if (this.folders[i].Folder_id == deletedFolderID) {
                        this.folders.splice(i, 1);
                    }
                }
                alert("Deleted!!");
                this.canEditFolder = false;
            } catch (error) {
                console.error("Failed to delete folder:", error);
            }
        },

        async SetDisplay(quiz) {
            this.curLookingQuiz = quiz;
            await this.FetchQuestion();
        },

        EditQuiz() {
            if (this.curLookingQuiz != null) {
                // store quiz and corresponding question to store
                this.quizStore.quiz = this.curLookingQuiz;
                this.questionsStore.questions = this.curLookingQuestions;
            }

            this.$router.push({
                name: 'EditQuiz',
            });
        },

        async TryCurrentQuiz() {
            if (!this.curLookingQuestions || this.curLookingQuestions.length === 0) {
                alert("This quiz has no questions. Please create questions first.");
                return;
            }

            this.quizStore.quiz = this.curLookingQuiz;
            const userID = JSON.parse(localStorage.getItem("userdata")).user.UserId;
            this.$router.push({
                name: "TakeQuiz",
                query: {
                    lastPathName: this.$route.name,
                    userID: userID,
                    quizID: this.curLookingQuiz.Quiz_id

                }
            });
        },

        CancelAction() {
            this.canCreateFolder = false;
            this.canEditFolder = false;
        },

        async FetchFolders() {
            try {
                const userId = JSON.parse(localStorage.getItem('userdata')).user.UserId;
                this.folders = await getSpecUserFolder(userId);
                // for each folder get quizes in it, get quizes from given folderId

                for (const folder of this.folders) {
                    try {
                        const quizzes = await getQuizzesByUserFolder(folder.Folder_id);
                        // append quizzes and show indicator in folder object
                        Object.assign(folder, {
                            quizzes: quizzes,
                            show: false,
                        });
                    } catch (error) {
                        console.error(`Failed to fetch quizzes for folder ${folder.Folder_id}:`, error);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch folders:", error);
            }
        },

        async FetchQuestion() {
            try {
                const questions = await GetQuestionsByQuizID(this.curLookingQuiz.Quiz_id);

                this.curLookingQuestions = questions;
            } catch (error) {
                console.error("Failed to fetch questions:", error);
            }

            // fill in blank... you are hard to deal with.....

        },

        async SetDisplay(quiz) {
            this.curLookingQuiz = quiz;
            await this.FetchQuestion();
        },
    },

    computed: {

    },

    watch: {

    },

    async created() {
        this.FetchFolders();
    },
}
</script>

<style scoped>

.display-area {
    margin: 10vh 5vw 10vh 14vw;
}
</style>