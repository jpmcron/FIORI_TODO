namespace my.todo;

using { managed } from '@sap/cds/common';

entity Todos : managed {
    key ID          : UUID              @cds.on.insert: $uuid;
    title           : String(200)       not null;
    description     : String(1000);
    status          : String(20)        default 'Open'
                        @assert.range enum {
                            Open;
                            InProgress  = 'In Progress';
                            Done;
                        };
    priority        : String(10)        default 'Medium'
                        @assert.range enum {
                            Low;
                            Medium;
                            High;
                        };
    dueDate         : Date;
}
