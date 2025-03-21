import { paginate } from 'common/collections';
import {
  Button,
  Icon,
  Input,
  Section,
  Stack,
  Tabs,
} from 'tgui-core/components';
import { BooleanLike } from 'tgui-core/react';

import { useBackend, useLocalState } from '../backend';
import { Window } from '../layouts';

const CATEGORY_PAGE_ITEMS = 4;
const EVENT_PAGE_ITEMS = 2;
const EVENT_PAGE_MAXCHARS = 48;

/**
 * Same as paginate, but respecting event names with a character max length
 * that will also create a new page if created
 */
const paginateEvents = (events: Event[], maxPerPage: number): Event[][] => {
  const pages: Event[][] = [];
  let page: Event[] = [];
  // conditions that make a new page
  let itemsToAdd = maxPerPage;
  let maxChars = EVENT_PAGE_MAXCHARS;

  for (const event of events) {
    if (event.name && typeof event.name === 'string') {
      maxChars -= event.name.length;
      if (maxChars <= 0) {
        // would overflow the next line over
        itemsToAdd = maxPerPage;
        maxChars = EVENT_PAGE_MAXCHARS - event.name.length;
        pages.push(page);
        page = [];
      }
    }
    page.push(event);
    itemsToAdd--;
    if (!itemsToAdd) {
      // max amount of items we allow
      itemsToAdd = maxPerPage;
      maxChars = EVENT_PAGE_MAXCHARS;
      pages.push(page);
      page = [];
    }
  }
  if (page.length) {
    pages.push(page);
  }
  return pages;
};

type Event = {
  name: string;
  description: string;
  type: string;
  category: string;
  has_customization: BooleanLike;
};

type Category = {
  name: string;
  icon: string;
};

type ForceEventData = {
  categories: Category[];
  events: Event[];
};

export const ForceEvent = (props) => {
  return (
    <Window theme="admin" title="Force Event" width={450} height={450}>
      <Window.Content>
        <Stack vertical fill>
          <Stack.Item>
            <EventTabs />
          </Stack.Item>
          <Stack.Item grow>
            <EventSection />
          </Stack.Item>
        </Stack>
      </Window.Content>
    </Window>
  );
};

export const PanelOptions = (props) => {
  const [searchQuery, setSearchQuery] = useLocalState('searchQuery', '');

  const [announce, setAnnounce] = useLocalState('announce', true);

  return (
    <Stack width="240px">
      <Stack.Item>
        <Icon name="search" />
      </Stack.Item>
      <Stack.Item grow>
        <Input
          autoFocus
          fluid
          onInput={(e, value) => setSearchQuery(value)}
          placeholder="Search..."
          value={searchQuery}
        />
      </Stack.Item>
      <Stack.Item>
        <Button.Checkbox
          fluid
          checked={announce}
          onClick={() => setAnnounce(!announce)}
        >
          Announce
        </Button.Checkbox>
      </Stack.Item>
    </Stack>
  );
};

export const EventSection = (props) => {
  const { data, act } = useBackend<ForceEventData>();
  const { categories, events } = data;

  const [category] = useLocalState('category', categories[0]);
  const [searchQuery] = useLocalState('searchQuery', '');
  const [announce] = useLocalState('announce', true);

  const preparedEvents = paginateEvents(
    events.filter((event) => {
      // remove events not in the category you're looking at
      if (!searchQuery && event.category !== category.name) {
        return false;
      }
      // remove events not being searched for, if a search is active
      if (
        searchQuery &&
        event.name &&
        typeof event.name === 'string' &&
        searchQuery &&
        typeof searchQuery === 'string' &&
        !event.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    }),
    EVENT_PAGE_ITEMS,
  );

  const sectionTitle = searchQuery ? 'Searching...' : category.name + ' Events';

  return (
    <Section scrollable fill title={sectionTitle} buttons={<PanelOptions />}>
      <Stack vertical>
        {preparedEvents.map((eventPage, i) => (
          <Stack.Item key={i}>
            <Stack>
              {eventPage.map((event) => (
                <Stack.Item grow key={event.type}>
                  <Button
                    className="Button__rightIcon"
                    tooltip={
                      event.description +
                      (event.has_customization
                        ? ' Includes admin customization.'
                        : '')
                    }
                    fluid
                    icon={event.has_customization ? 'gear' : undefined}
                    iconPosition="right"
                    onClick={() =>
                      act('forceevent', {
                        type: event.type,
                        announce: announce,
                      })
                    }
                  >
                    {event.name}
                  </Button>
                </Stack.Item>
              ))}
            </Stack>
          </Stack.Item>
        ))}
      </Stack>
    </Section>
  );
};

export const EventTabs = (props) => {
  const { data } = useBackend<ForceEventData>();
  const { categories } = data;

  const [category, setCategory] = useLocalState('category', categories[0]);

  const layerCats = paginate(categories, CATEGORY_PAGE_ITEMS);

  return (
    <Section mb="-6px">
      {layerCats.map((page, i) => (
        <Tabs mb="-3px" fluid key={i}>
          {page.map((cat) => (
            <Tabs.Tab
              selected={category === cat}
              icon={cat.icon}
              key={cat.icon}
              onClick={() => setCategory(cat)}
            >
              {cat.name}
            </Tabs.Tab>
          ))}
        </Tabs>
      ))}
    </Section>
  );
};
