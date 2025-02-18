import { FC, useMemo, useState } from 'react';
import { JsonForms } from '@jsonforms/react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  ControlElement,
  GroupLayout,
  isControl,
  isGroup,
  JsonSchema,
  Layout,
  UISchemaElement,
} from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import RatingControl from './RatingControl';
import ratingControlTester from '../ratingControlTester';
import AccordionLayout, { AccordionLayoutTester } from './AccordionLayout';
import initialSchema from '../schema.json';
import initialUischema from '../uischema.json';

const classes = {
  container: {
    padding: '1em',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    padding: '0.25em',
  },
  dataContent: {
    display: 'flex',
    justifyContent: 'center',
    borderRadius: '0.25em',
    backgroundColor: '#cecece',
    marginBottom: '1rem',
  },
  resetButton: {
    margin: 'auto !important',
    display: 'block !important',
  },
  demoform: {
    margin: 'auto',
    padding: '1rem',
  },
};

const initialData = {
  name: 'Send email to Adrian',
  description: 'Confirm if you have passed the subject\nHereby ...',
  done: true,
  recurrence: 'Daily',
  rating: 6,
  subtask: {
    name: 'Reply to email from Rocky',
    done: true,
  },
};

const renderers = [
  ...materialRenderers,
  //register custom renderers
  { tester: ratingControlTester, renderer: RatingControl },
  { tester: AccordionLayoutTester, renderer: AccordionLayout },
];

const findAndInsertSubstack = (
  uischemaElements: UISchemaElement[],
  count: number,
  subtaskKeyBase: string,
) => {
  const subtaskPattern = new RegExp(`^${subtaskKeyBase}(_ADD_\\d+)?$`);

  // Find the maximum index for ADD_x and recursively process elements
  const { maxIndex, processedElements } = findMaxIndexAndProcess(
    [...uischemaElements],
    subtaskPattern,
  );
  console.log(`maxIndex: ${maxIndex}`);

  // Insert a new subtask after the last 'Subtask' group found
  return insertNewSubtask(processedElements, count, maxIndex, subtaskKeyBase);
};

const findMaxIndexAndProcess = (
  elements: UISchemaElement[],
  pattern: RegExp,
) => {
  let maxIndex = 0;

  const processElement = (element: Layout): Layout => {
    if (isGroup(element) && (element as GroupLayout).label === 'Subtask') {
      for (const el of (element as Layout).elements || []) {
        if (isControl(el) && pattern.test(el.scope)) {
          const match = el.scope.match(pattern);
          if (match && match[1]) {
            const index = parseInt(match[1].split('_')[2], 10);
            maxIndex = Math.max(maxIndex, index + 1);
          }
        } else if (!pattern.test((el as ControlElement).scope)) {
          maxIndex = Math.max(maxIndex, 0);
        }
      }

      // Recursively process nested elements
      if ((element as Layout).elements) {
        const nestedElements = findMaxIndexAndProcess(
          (element as Layout).elements,
          pattern,
        );
        return {
          ...element,
          elements: nestedElements.processedElements,
        } as Layout;
      }
    }

    return element;
  };

  const processedElements = elements
    .map(el => el as Layout)
    .map(processElement);

  return { maxIndex, processedElements };
};

const findSubtaskGroupIndex = (
  elements: UISchemaElement[],
): { groupIndex: number; subIndex: number } => {
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i] as Layout;

    if (isGroup(element) && (element as GroupLayout).label === 'Subtask') {
      return { groupIndex: i, subIndex: -1 };
    }

    // Recursively check nested groups
    if (isGroup(element)) {
      const { groupIndex: nestedIndex } = findSubtaskGroupIndex(
        (element as Layout).elements || [],
      );
      if (nestedIndex !== -1) {
        return { groupIndex: i, subIndex: nestedIndex };
      }
    }
  }

  return { groupIndex: -1, subIndex: -1 };
};

const insertNewSubtask = (
  elements: UISchemaElement[],
  count: number,
  maxIndex: number,
  subtaskKeyBase: string,
) => {
  const scopePattern = new RegExp(subtaskKeyBase, 'g');

  const { groupIndex } = findSubtaskGroupIndex(elements);
  console.log(`elements: ${JSON.stringify(elements, null, 2)}`);
  console.log(`groupIndex: ${groupIndex}`);

  if (groupIndex !== -1) {
    const newSubtaskLabel = `Subtask ${count}`;

    // Construct the new subtask
    const newSubtask: UISchemaElement = {
      ...elements[groupIndex],
      label: newSubtaskLabel,
      elements: (elements[groupIndex] as Layout).elements!.map(el => {
        if (isControl(el)) {
          return {
            ...el,
            scope: el.scope.replace(
              scopePattern,
              `${subtaskKeyBase}__ADD_${maxIndex}`,
            ),
          };
        }
        return el;
      }) as UISchemaElement[],
    } as Layout;

    // Insert the new subtask after the found 'Subtask' group
    elements = [
      ...elements.slice(0, groupIndex + 1),
      newSubtask,
      ...elements.slice(groupIndex + 1),
    ];
  }

  return elements;
};

export const JsonFormsDemo: FC = () => {
  const [schema, setSchema] = useState<JsonSchema>(initialSchema);
  const [uischema, setUischema] = useState<UISchemaElement>(initialUischema);
  const [data, setData] = useState<object>(initialData);
  const stringifiedData = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const clearData = () => {
    setData({});
  };

  const addSubTask = () => {
    console.log('add subtask');
    const updatedSchema = { ...schema };
    const subtaskKeyBase = 'subtask';
    let count = 1;

    if (!updatedSchema.properties) {
      updatedSchema.properties = {};
    }
    while (updatedSchema.properties[`${subtaskKeyBase}__ADD_${count}`]) {
      count++;
    }

    updatedSchema.properties[`${subtaskKeyBase}__ADD_${count}`] = {
      ...updatedSchema.properties[subtaskKeyBase],
      title: `Subtask ${count}`,
    };
    setSchema(updatedSchema);

    const updatedUischema = { ...uischema } as Layout;
    updatedUischema.elements = findAndInsertSubstack(
      updatedUischema.elements,
      count,
      subtaskKeyBase,
    );
    console.log(`updatedUischema: ${JSON.stringify(updatedUischema, null, 2)}`);
    setUischema(updatedUischema);
  };

  return (
    <Grid
      container
      justifyContent={'center'}
      spacing={1}
      style={classes.container}>
      <Grid item sm={6}>
        <Typography variant={'h4'}>Bound data</Typography>
        <div style={classes.dataContent}>
          <pre id="boundData">{stringifiedData}</pre>
        </div>
        <Button
          style={classes.resetButton}
          onClick={clearData}
          color="primary"
          variant="contained"
          data-testid="clear-data">
          Clear data
        </Button>
      </Grid>
      <Grid item sm={6}>
        <Typography variant={'h4'}>Rendered form</Typography>
        <Button onClick={addSubTask} color="secondary" variant="contained">
          Add subtask
        </Button>
        <div style={classes.demoform}>
          <JsonForms
            schema={schema}
            uischema={uischema}
            data={data}
            renderers={renderers}
            cells={materialCells}
            onChange={({ data }) => setData(data)}
          />
        </div>
      </Grid>
    </Grid>
  );
};
