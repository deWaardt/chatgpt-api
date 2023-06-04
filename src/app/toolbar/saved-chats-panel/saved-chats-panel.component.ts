import {Component, HostBinding, HostListener, Renderer2} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";
import {MessageService} from "../../services/message.service";
import {HighlightService} from "../../services/highlight.service";
import {ChatCompletionRequestMessage} from "openai/dist/api";
import {debounceTime, fromEvent} from "rxjs";

@Component({
  selector: 'app-saved-chats-panel',
  templateUrl: './saved-chats-panel.component.html',
  styleUrls: ['./saved-chats-panel.component.css']
})
export class SavedChatsPanelComponent {
  constructor(private dialogRef: MatDialogRef<SavedChatsPanelComponent>, private messageService: MessageService, private highlightService: HighlightService, private renderer: Renderer2) {
  }

  steps: number;
  messageHistory: Chat[] = [];
  messageHistoryPaginated: Chat[] = [];
  chatSelected: boolean = false;
  aboutToDelete: boolean = false;
  chatName: string = "";
  currentLoadedChatName: string = "";
  containerHeight: string = '';
  dialogWidth: string = '';
  dialogHeight: string = '';
  loadButtonWidth: string = '';
  deleteButtonWidth: string = '';
  descriptionWidth: string = '';
  confirmDeleteAllChats: boolean = false;


  ngOnInit(): void {
    this.renderer.addClass(document.body, 'indigo-pink');
    if (localStorage.getItem('chatHistory') === null) {
      this.messageHistory = [];
    } else {
      this.messageHistory = JSON.parse(localStorage.getItem('chatHistory'));
    }
    if (this.messageService.currentChatName.length > 0) {
      this.currentLoadedChatName = this.messageService.currentChatName;
      this.chatName = this.messageService.currentChatName;
    }
    this.calculateDialogSize();
    this.containerHeight = this.calculateAccordionHeight();



  }


  calculateAccordionHeight(): string {
    const height = window.innerHeight;
    console.log(height);
    const {minWindowHeight, maxWindowHeight, minElementHeight, maxElementHeight} = this.dialogWidth === '80vw'
      ? {minWindowHeight: 200, maxWindowHeight: 1100, minElementHeight: 0, maxElementHeight: 650}
      : {minWindowHeight: 400, maxWindowHeight: 1300, minElementHeight: 25, maxElementHeight: 700};

    let containerHeight;
    if (height < minWindowHeight) {
      containerHeight = [minElementHeight];
    } else if (height >= minWindowHeight && height <= maxWindowHeight) {
      const rangeWindowHeight = maxWindowHeight - minWindowHeight;
      const rangeElementHeight = maxElementHeight - minElementHeight;
      const heightRatio = (height - minWindowHeight) / rangeWindowHeight;
      containerHeight = [minElementHeight + Math.round(heightRatio * rangeElementHeight)];
    } else {
      containerHeight = [maxElementHeight];
    }
    console.log(containerHeight);
    return containerHeight + 'px';
  }


  calculateDialogSize() {
    const width = window.innerWidth;
    const breakpoints = [1400];
    const values = ['80vw', '50vw'];

    let index = 0;
    while (index < breakpoints.length && width > breakpoints[index]) {
      index++;
    }

    if (width < 1100) {
      this.loadButtonWidth = '50%';
      this.deleteButtonWidth = "20%";
      this.descriptionWidth = "75px"
    } else {
      this.loadButtonWidth = '85%';
      this.deleteButtonWidth = "10%";
      this.descriptionWidth = "150px"
    }

    this.dialogWidth = values[index];
    if (this.dialogWidth === '80vw') this.dialogHeight = '80vh'
    else this.dialogHeight = '70vh';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.containerHeight = this.calculateAccordionHeight();
    this.calculateDialogSize();
  }

  saveChat() {
    if (this.messageService.messages.length === 0) {
      alert("You can't save an empty chat!");
      return;
    }
    let chat: Chat = new Chat();

    const chatExists: Chat = this.messageHistory.find(c => c.name === this.chatName);
    if (chatExists) chat = chatExists;

    chat.name = this.chatName;
    chat.messages = this.messageService.messages;
    chat.chatHistory = this.messageService.chatHistory;
    chat.createdOnDate = new Date().toLocaleString();
    if (chatExists) {
      this.messageHistory[this.messageHistory.indexOf(chatExists)] = chat;
    } else this.messageHistory.push(chat);
    localStorage.setItem('chatHistory', JSON.stringify(this.messageHistory));
    this.close();
  }

  close() {
    this.dialogRef.close();
  }

  loadChat(chat: Chat, override: boolean) {
    if (this.messageService.messages.length > 0 && !override) {
      this.chatSelected = true;
      return;
    }

    this.messageService.currentChatName = chat.name;
    this.messageService.messages = chat.messages;
    this.messageService.chatHistory = chat.chatHistory;
    this.highlightService.highlightAll();
    this.dialogRef.close();
  }

  cancelLoadChat() {
    this.chatSelected = false;
  }

  deleteChat(chat: Chat) {
    this.aboutToDelete = false;
    this.messageHistory = this.messageHistory.filter(c => c !== chat);
    localStorage.setItem('chatHistory', JSON.stringify(this.messageHistory));
  }

  deleteAll() {
    if(this.confirmDeleteAllChats) {
      this.messageHistory = [];
      localStorage.removeItem('chatHistory');
      this.confirmDeleteAllChats = false;
    }
  }
}

export class Chat {
  name: string;
  createdOnDate: string;
  messages: { content: string; contentRaw: string; isRaw?: boolean; timestamp: Date; avatar: string; isUser: boolean; }[] = [];
  chatHistory: ChatCompletionRequestMessage[] = [];
}
