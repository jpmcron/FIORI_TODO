using { my.todo as my } from '../db/schema';

@path: '/todo'
service TodoService {
    @restrict: [
        { grant: 'READ' },
        { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'authenticated-user' }
    ]
    entity Todos as projection on my.Todos {
        *,
        case status
            when 'Open'        then 0
            when 'In Progress' then 2
            when 'Done'        then 3
            else                    0
        end as statusCriticality : Integer
    };
}

// ── Field-level ───────────────────────────────────────────────────────────────
annotate TodoService.Todos with {
    ID                @UI.Hidden;
    statusCriticality @UI.Hidden;
    status   @(
        Common.Label                : 'Status',
        Common.ValueListWithFixedValues: true
    );
    priority @(
        Common.Label                : 'Priority',
        Common.ValueListWithFixedValues: true
    );
    createdAt  @(UI.HiddenFilter: true, Core.Computed: true);
    createdBy  @(UI.HiddenFilter: true, Core.Computed: true);
    modifiedAt @(UI.HiddenFilter: true, Core.Computed: true);
    modifiedBy @(UI.HiddenFilter: true, Core.Computed: true);
};

// ── List Report ───────────────────────────────────────────────────────────────
annotate TodoService.Todos with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: title,    Label: 'Title'    },
        {
            $Type                   : 'UI.DataField',
            Value                   : status,
            Label                   : 'Status',
            Criticality             : statusCriticality,
            CriticalityRepresentation: #WithoutIcon
        },
        { $Type: 'UI.DataField', Value: priority, Label: 'Priority' },
        { $Type: 'UI.DataField', Value: dueDate,  Label: 'Due Date' }
    ],
    UI.SelectionFields: [ status, priority, dueDate ],
    UI.PresentationVariant: {
        SortOrder    : [{ Property: dueDate, Descending: false }],
        Visualizations: ['@UI.LineItem']
    }
);

// ── Object Page ───────────────────────────────────────────────────────────────
annotate TodoService.Todos with @(
    UI.HeaderInfo: {
        TypeName      : 'Todo',
        TypeNamePlural: 'Todos',
        Title        : { $Type: 'UI.DataField', Value: title },
        Description  : { $Type: 'UI.DataFieldForAnnotation', Target: '@UI.DataPoint#Status' }
    },
    UI.DataPoint#Status: {
        Value      : status,
        Criticality: statusCriticality,
        Title      : 'Status'
    },
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Details',
            ID    : 'Details',
            Target: '@UI.FieldGroup#Details'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Administration',
            ID    : 'Admin',
            Target: '@UI.FieldGroup#Admin'
        }
    ],
    UI.FieldGroup#Details: {
        Label: 'Details',
        Data : [
            { $Type: 'UI.DataField', Value: description, Label: 'Description' },
            { $Type: 'UI.DataField', Value: dueDate,     Label: 'Due Date'    },
            { $Type: 'UI.DataField', Value: priority,    Label: 'Priority'    }
        ]
    },
    UI.FieldGroup#Admin: {
        Label: 'Administration',
        Data : [
            { $Type: 'UI.DataField', Value: createdAt,  Label: 'Created At'  },
            { $Type: 'UI.DataField', Value: createdBy,  Label: 'Created By'  },
            { $Type: 'UI.DataField', Value: modifiedAt, Label: 'Modified At' },
            { $Type: 'UI.DataField', Value: modifiedBy, Label: 'Modified By' }
        ]
    }
);
