import React, { memo } from 'react';
import { Group, Header, List, Cell } from '@vkontakte/vkui';

const RatingRules = () => {
  return (
    <Group header={<Header mode="secondary">Как происходит расчет рейтинга?</Header>}>
      <List>
        <Cell multiline={true}>
          1&#41; Каждому из вопросов присвоен уровень сложности - от 1 до 3;
        </Cell>
        <Cell multiline={true}>
          2&#41; Ответив на вопрос правильно вы получаете от 1 до 3 баллов в зависимости от его сложности;
        </Cell>
        <Cell multiline={true}>
          3&#41; За правильный ответ в течение первых 3 секунд вы получаете дополнительный балл;
        </Cell>
        <Cell multiline={true}>
          4&#41; Игрок, набравший наибольшее количество баллов по результатам 10 вопросов, побеждает;
        </Cell>
        <Cell multiline={true}>
          5&#41; Каждый из игроков получит столько очков рейтинга, сколько баллов он заработал за игру.
        </Cell>
      </List>
    </Group>
  );
};

export default memo(RatingRules);
