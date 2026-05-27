namespace my.todo;

using { managed } from '@sap/cds/common';

type TodoStatus : String(20) @assert.range enum {
    Open        = 'Open';
    InProgress  = 'In Progress';
    Done        = 'Done';
};

type TodoPriority : String(10) @assert.range enum {
    Low    = 'Low';
    Medium = 'Medium';
    High   = 'High';
};

entity Todos : managed {
    key ID          : UUID          @cds.on.insert: $uuid;
    title           : String(200)   not null;
    description     : String(1000);
    status          : TodoStatus    default 'Open';
    priority        : TodoPriority  default 'Medium';
    dueDate         : Date;
}
